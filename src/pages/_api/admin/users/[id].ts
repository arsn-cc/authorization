import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe } from "@/lib/http/validate";
import { updateUserSchema } from "@/lib/schemas/admin";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { usernameToEmail, hashPassword, isValidUsername, isValidPassword, sessionKeyFromHash } from "@/lib/auth/utils";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";
import {
	sendPasswordChangedEmail,
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
			emailVerified: schema.user.emailVerified,
			name: schema.user.name,
			displayName: schema.user.displayName,
			image: schema.user.image,
			timezone: schema.user.timezone,
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

	const stringFields = ["name", "displayName", "image", "timezone"] as const;

	for (const field of stringFields) {
		if (parsed[field] !== undefined) {
			updates[field] = parsed[field];
		}
	}

	if (parsed.roleId !== undefined) {
		updates.roleId = parsed.roleId;
		// Privilege changed: revoke existing sessions so the new role takes effect
		// immediately. getSession caches the roleId snapshot for the full session TTL
		// (up to 7 days); without this, a demoted/revoked user keeps prior privileges
		// until the session expires or they re-log in.
		const existing = await db
			.select({ tokenHash: schema.session.tokenHash })
			.from(schema.session)
			.where(eq(schema.session.userId, userId));
		await db.delete(schema.session).where(eq(schema.session.userId, userId));
		const cache = await getCache();
		await Promise.all(existing.map((s) => cache.delete(sessionKeyFromHash(s.tokenHash ?? ""))));
	}

	if (parsed.username && isValidUsername(parsed.username) && parsed.username !== current.username) {
		const [existing] = await db.select().from(schema.user).where(eq(schema.user.username, parsed.username)).limit(1);
		if (!existing) {
			updates.username = parsed.username;
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
		name: schema.user.name,
		updatedAt: schema.user.updatedAt,
	});

	if (!updated) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	const displayName = updated.name ?? updated.username;

	if (passwordChanged) {
		await sendPasswordChangedEmail(usernameToEmail(updated.username), { username: displayName });
	}

	if (parsed.lockedUntil !== undefined) {
		if (parsed.lockedUntil === null) {
			// unlocked — no notification needed
		} else if (parsed.suspensionReason) {
			await sendAccountSuspendedEmail(usernameToEmail(updated.username), {
				username: displayName,
				reason: parsed.suspensionReason,
			});
		} else {
			await sendAccountLockedAdminEmail(usernameToEmail(updated.username), {
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
		.select({ username: schema.user.username, name: schema.user.name })
		.from(schema.user)
		.where(eq(schema.user.id, userId));

	if (!user) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	await sendAccountDeletedAdminEmail(usernameToEmail(user.username), {
		username: user.name ?? user.username,
	});

	const sessions = await db
		.select({ id: schema.session.id, tokenHash: schema.session.tokenHash })
		.from(schema.session)
		.where(eq(schema.session.userId, userId));

	await Promise.all([
		db.delete(schema.session).where(eq(schema.session.userId, userId)),
		db.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.userId, userId)),
		db.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.userId, userId)),
		db.delete(schema.oauthAuthorizationCode).where(eq(schema.oauthAuthorizationCode.userId, userId)),
		db.delete(schema.personalAccessToken).where(eq(schema.personalAccessToken.userId, userId)),
		db.delete(schema.passwordResetToken).where(eq(schema.passwordResetToken.userId, userId)),
		db.delete(schema.pendingAuthToken).where(eq(schema.pendingAuthToken.userId, userId)),
		db.delete(schema.emailVerificationToken).where(eq(schema.emailVerificationToken.userId, userId)),
		db.delete(schema.accountDeletionToken).where(eq(schema.accountDeletionToken.userId, userId)),
		db.delete(schema.accountUnlockToken).where(eq(schema.accountUnlockToken.userId, userId)),
		db.delete(schema.emailTwoFactorToken).where(eq(schema.emailTwoFactorToken.userId, userId)),
		db.delete(schema.user).where(eq(schema.user.id, userId)),
		...sessions.map((s) => cache.delete(sessionKeyFromHash(s.tokenHash ?? ""))),
	]);

	return withSecurityHeaders(new Response(null, { status: 204 }));
}
