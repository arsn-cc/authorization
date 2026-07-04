import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe } from "@/lib/http/validate";
import { updateUserSchema } from "@/lib/schemas/admin";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { usernameToEmail, hashPassword, isValidUsername, isValidPassword, sessionKey } from "@/lib/auth/utils";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";
import {
	sendPasswordChangedEmail,
	sendEmailChangedEmail,
	sendAccountLockedAdminEmail,
	sendAccountSuspendedEmail,
	sendAccountDeletedAdminEmail,
} from "@/lib/auth/email";

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

	const [current] = await db
		.select({
			username: schema.user.username,
			email: schema.user.email,
			name: schema.user.name,
			lockedUntil: schema.user.lockedUntil,
		})
		.from(schema.user)
		.where(eq(schema.user.id, userId));

	if (!current) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	const updates: Record<string, unknown> = {};
	let passwordChanged = false;
	let emailChanged = false;
	let oldEmail = current.email;

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

	if (parsed.username && isValidUsername(parsed.username) && parsed.username !== current.username) {
		const email = usernameToEmail(parsed.username);
		const [existing] = await db
			.select()
			.from(schema.user)
			.where(and(eq(schema.user.username, parsed.username), eq(schema.user.email, email)))
			.limit(1);
		if (!existing) {
			updates.username = parsed.username;
			updates.email = email;
			emailChanged = true;
		}
	}

	if (parsed.password) {
		if (!isValidPassword(parsed.password)) {
			return withSecurityHeaders(Response.json({ error: "password_too_simple" }, { status: 400 }));
		}
		updates.passwordHash = hashPassword(parsed.password);
		passwordChanged = true;
	}

	if (parsed.lockedUntil !== undefined) {
		updates.lockedUntil = parsed.lockedUntil === null ? null : new Date(parsed.lockedUntil);
	}

	updates.updatedAt = new Date();

	const [updated] = await db.update(schema.user).set(updates).where(eq(schema.user.id, userId)).returning({
		id: schema.user.id,
		username: schema.user.username,
		email: schema.user.email,
		name: schema.user.name,
		updatedAt: schema.user.updatedAt,
	});

	if (!updated) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	const displayName = updated.name ?? updated.username;

	if (passwordChanged) {
		await sendPasswordChangedEmail(updated.email, { username: displayName });
	}

	if (emailChanged) {
		await sendEmailChangedEmail(
			oldEmail,
			{
				username: displayName,
				newEmail: updated.email,
			},
			userId,
		);
	}

	if (parsed.lockedUntil !== undefined) {
		if (parsed.lockedUntil === null) {
			// unlocked — no notification needed
		} else if (parsed.suspensionReason) {
			await sendAccountSuspendedEmail(updated.email, {
				username: displayName,
				reason: parsed.suspensionReason,
			});
		} else {
			await sendAccountLockedAdminEmail(updated.email, {
				username: displayName,
			});
		}
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

	const [user] = await db
		.select({ username: schema.user.username, email: schema.user.email, name: schema.user.name })
		.from(schema.user)
		.where(eq(schema.user.id, userId));

	if (!user) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	await sendAccountDeletedAdminEmail(user.email, {
		username: user.name ?? user.username,
	});

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
