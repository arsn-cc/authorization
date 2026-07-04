import { withSecurityHeaders } from "@/lib/http/response";
import { and, eq, not } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { verifyPassword, hashPassword, isValidPassword, sessionKey } from "@/lib/auth/utils";
import { invalidateUser } from "@/lib/auth/cache";
import { getAccountUser, unauthorized } from "@/lib/auth/account-auth";
import { parseJsonSafe } from "@/lib/http/validate";
import { passwordChangeSchema } from "@/lib/schemas/auth";

export async function POST(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const body = await parseJsonSafe(req, passwordChangeSchema);
	if (body instanceof Response) {
		return body;
	}
	const { currentPassword, newPassword } = body;

	if (!isValidPassword(newPassword)) {
		return withSecurityHeaders(Response.json({ error: "new_password_insufficient_complexity" }, { status: 400 }));
	}

	const db = await getDb();
	const [user] = await db
		.select({ passwordHash: schema.user.passwordHash })
		.from(schema.user)
		.where(eq(schema.user.id, authed.userId));

	if (!user || !user.passwordHash) {
		return withSecurityHeaders(Response.json({ error: "password_not_set" }, { status: 400 }));
	}

	if (!verifyPassword(currentPassword, user.passwordHash)) {
		return withSecurityHeaders(Response.json({ error: "current_password_incorrect" }, { status: 403 }));
	}

	const now = new Date();

	// Invalidate all sessions except the current one (if session-based)
	const sessions = await db
		.select({ token: schema.session.token, id: schema.session.id })
		.from(schema.session)
		.where(eq(schema.session.userId, authed.userId));

	const cache = await getCache();
	const currentToken = authed.sessionToken;

	const sessionDeleteCond = currentToken
		? and(eq(schema.session.userId, authed.userId), not(eq(schema.session.token, currentToken)))
		: eq(schema.session.userId, authed.userId);

	await Promise.all([
		db
			.update(schema.user)
			.set({ passwordHash: hashPassword(newPassword), updatedAt: now })
			.where(eq(schema.user.id, authed.userId)),
		db.delete(schema.session).where(sessionDeleteCond),
		...sessions.filter((s) => s.token !== currentToken).map((s) => cache.delete(sessionKey(s.token))),
	]);

	await invalidateUser({ id: authed.userId, username: authed.user.username, email: authed.user.email });

	const terminatedCount = sessions.filter((s) => s.token !== currentToken).length;

	return withSecurityHeaders(
		Response.json({
			message: "password_updated",
			sessionsTerminated: terminatedCount,
		}),
	);
}
