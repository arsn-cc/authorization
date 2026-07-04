import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe } from "@/lib/http/validate";
import { updateUserSchema } from "@/lib/schemas/admin";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { usernameToEmail, hashPassword, isValidUsername, isValidPassword, sessionKey } from "@/lib/auth/utils";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersRead);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const [user] = await db
		.select({
			id: schema.user.id,
			username: schema.user.username,
			email: schema.user.email,
			emailVerified: schema.user.emailVerified,
			name: schema.user.name,
			givenName: schema.user.givenName,
			familyName: schema.user.familyName,
			displayName: schema.user.displayName,
			nickname: schema.user.nickname,
			image: schema.user.image,
			phoneNumber: schema.user.phoneNumber,
			phoneNumberVerified: schema.user.phoneNumberVerified,
			profileUrl: schema.user.profileUrl,
			websiteUrl: schema.user.websiteUrl,
			address: schema.user.address,
			externalId: schema.user.externalId,
			preferredLanguage: schema.user.preferredLanguage,
			locale: schema.user.locale,
			timezone: schema.user.timezone,
			loginShell: schema.user.loginShell,
			gecos: schema.user.gecos,
			roleId: schema.user.roleId,
			createdAt: schema.user.createdAt,
			updatedAt: schema.user.updatedAt,
		})
		.from(schema.user)
		.where(eq(schema.user.id, Number(params.id)));

	if (!user) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	return withSecurityHeaders(Response.json(user));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersWrite);
	if (result instanceof Response) {
		return result;
	}

	const parsed = await parseJsonSafe(req, updateUserSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const userId = Number(params.id);
	const db = await getDb();

	const updates: Record<string, unknown> = {};

	const stringFields = [
		"name",
		"givenName",
		"familyName",
		"displayName",
		"nickname",
		"image",
		"phoneNumber",
		"profileUrl",
		"websiteUrl",
		"address",
		"externalId",
		"preferredLanguage",
		"locale",
		"timezone",
		"loginShell",
		"gecos",
	] as const;

	for (const field of stringFields) {
		if (parsed[field] !== undefined) {
			updates[field] = parsed[field];
		}
	}

	if (parsed.roleId !== undefined) {
		updates.roleId = parsed.roleId;
	}

	if (parsed.username && isValidUsername(parsed.username)) {
		const email = usernameToEmail(parsed.username);
		const [existing] = await db
			.select()
			.from(schema.user)
			.where(and(eq(schema.user.username, parsed.username), eq(schema.user.email, email)))
			.limit(1);
		if (!existing) {
			updates.username = parsed.username;
			updates.email = email;
		}
	}

	if (parsed.password && isValidPassword(parsed.password)) {
		updates.passwordHash = hashPassword(parsed.password);
	}

	updates.updatedAt = new Date();

	const [updated] = await db.update(schema.user).set(updates).where(eq(schema.user.id, userId)).returning({
		id: schema.user.id,
		username: schema.user.username,
		email: schema.user.email,
		updatedAt: schema.user.updatedAt,
	});

	if (!updated) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	return withSecurityHeaders(Response.json(updated));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersDelete);
	if (result instanceof Response) {
		return result;
	}

	if (result.userId === Number(params.id)) {
		return withSecurityHeaders(Response.json({ error: "cannot_delete_own_account" }, { status: 403 }));
	}

	const db = await getDb();
	const cache = await getCache();
	const userId = Number(params.id);

	const sessions = await db
		.select({ id: schema.session.id, token: schema.session.token })
		.from(schema.session)
		.where(eq(schema.session.userId, userId));

	await Promise.all([
		db.delete(schema.session).where(eq(schema.session.userId, userId)),
		db.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.userId, userId)),
		db.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.userId, userId)),
		db.delete(schema.oauthAuthorizationCode).where(eq(schema.oauthAuthorizationCode.userId, userId)),
		db.delete(schema.user).where(eq(schema.user.id, userId)),
		...sessions.map((s) => cache.delete(sessionKey(s.token))),
	]);

	return withSecurityHeaders(new Response(null, { status: 204 }));
}
