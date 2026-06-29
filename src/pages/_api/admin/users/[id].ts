import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { usernameToEmail, hashPassword, isValidUsername } from "@/lib/auth";
import { sessionKey } from "@/lib/auth/utils";
import { getAdminUser, unauthorized } from "../auth";

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const admin = await getAdminUser(req);
	if (!admin) {
		return unauthorized();
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
		return Response.json({ error: "not_found" }, { status: 404 });
	}

	return Response.json(user);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const admin = await getAdminUser(req);
	if (!admin) {
		return unauthorized();
	}

	const body = (await req.json()) as Record<string, unknown>;
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
		if (body[field] !== undefined) {
			updates[field] = body[field] === null ? null : (body[field] as string);
		}
	}

	if (body.roleId !== undefined) {
		updates.roleId = body.roleId === null ? null : Number(body.roleId);
	}

	if (body.username && typeof body.username === "string" && isValidUsername(body.username)) {
		const email = usernameToEmail(body.username);
		const [existing] = await db
			.select()
			.from(schema.user)
			.where(and(eq(schema.user.username, body.username), eq(schema.user.email, email)))
			.limit(1);
		if (!existing) {
			updates.username = body.username;
			updates.email = email;
		}
	}

	if (body.password && typeof body.password === "string" && body.password.length >= 8) {
		updates.passwordHash = hashPassword(body.password);
	}

	updates.updatedAt = new Date();

	const [updated] = await db.update(schema.user).set(updates).where(eq(schema.user.id, userId)).returning({
		id: schema.user.id,
		username: schema.user.username,
		email: schema.user.email,
		updatedAt: schema.user.updatedAt,
	});

	if (!updated) {
		return Response.json({ error: "not_found" }, { status: 404 });
	}

	return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const admin = await getAdminUser(req);
	if (!admin) {
		return unauthorized();
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

	return new Response(null, { status: 204 });
}
