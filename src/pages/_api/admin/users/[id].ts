import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getSession, usernameToEmail, hashPassword, isValidUsername } from "@/lib/auth";

function parseCookie(cookie: string, name: string): string | null {
	const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]!) : null;
}

async function requireAdmin(req: Request): Promise<Response | null> {
	const cookie = req.headers.get("cookie") ?? "";
	const token = parseCookie(cookie, "session_token");
	if (!token) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}
	const session = await getSession(token);
	if (!session.success || !session.data) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}
	return null;
}

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const authError = await requireAdmin(req);
	if (authError) {
		return authError;
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
	const authError = await requireAdmin(req);
	if (authError) {
		return authError;
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
	const authError = await requireAdmin(req);
	if (authError) {
		return authError;
	}

	const db = await getDb();
	const userId = Number(params.id);

	await Promise.all([
		db.delete(schema.session).where(eq(schema.session.userId, userId)),
		db.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.userId, userId)),
		db.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.userId, userId)),
		db.delete(schema.oauthAuthorizationCode).where(eq(schema.oauthAuthorizationCode.userId, userId)),
		db.delete(schema.user).where(eq(schema.user.id, userId)),
	]);

	return new Response(null, { status: 204 });
}
