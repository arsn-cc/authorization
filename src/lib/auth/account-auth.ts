import { withSecurityHeaders } from "@/lib/http/response";
import { and, eq, gte, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { toUserResult } from "@/lib/auth/cache";
import { hashToken, parseCookie, SESSION_COOKIE_NAME } from "@/lib/auth/utils";
import type { UserResult } from "@/lib/auth/types";

export interface AuthenticatedUser {
	userId: number;
	sessionToken: string | null;
	user: UserResult;
}

async function getBearerUser(token: string): Promise<{ userId: number; user: UserResult } | null> {
	const db = await getDb();

	const [row] = await db
		.select({ user: schema.user })
		.from(schema.oauthAccessToken)
		.where(
			and(eq(schema.oauthAccessToken.tokenHash, hashToken(token)), gte(schema.oauthAccessToken.expiresAt, new Date())),
		)
		.innerJoin(schema.user, eq(schema.oauthAccessToken.userId, schema.user.id));

	if (row) {
		return { userId: row.user.id, user: toUserResult(row.user) };
	}

	const [patRow] = await db
		.select({ user: schema.user, pat: { id: schema.personalAccessToken.id } })
		.from(schema.personalAccessToken)
		.where(
			and(eq(schema.personalAccessToken.tokenHash, hashToken(token)), isNull(schema.personalAccessToken.revokedAt)),
		)
		.innerJoin(schema.user, eq(schema.personalAccessToken.userId, schema.user.id));

	if (patRow) {
		const now = new Date();
		await db
			.update(schema.personalAccessToken)
			.set({ lastUsedAt: now })
			.where(eq(schema.personalAccessToken.id, patRow.pat.id));

		return { userId: patRow.user.id, user: toUserResult(patRow.user) };
	}

	return null;
}

async function getSessionUser(token: string): Promise<AuthenticatedUser | null> {
	const session = await getSession(token);
	if (!session.success || !session.data) {
		return null;
	}

	return {
		userId: session.data.userId,
		sessionToken: session.data.token,
		user: session.data.user,
	};
}

export async function getAccountUser(req: Request): Promise<AuthenticatedUser | null> {
	return getRequestUser(req);
}

export async function getRequestUser(req: Request): Promise<AuthenticatedUser | null> {
	const auth = req.headers.get("authorization");
	if (auth?.startsWith("Bearer ")) {
		const bearerUser = await getBearerUser(auth.slice(7));
		if (!bearerUser) {
			return null;
		}
		return { ...bearerUser, sessionToken: null };
	}

	const cookie = req.headers.get("cookie") ?? "";
	const sessionToken = parseCookie(cookie, SESSION_COOKIE_NAME);
	if (!sessionToken) {
		return null;
	}

	return getSessionUser(sessionToken);
}

export function unauthorized(): Response {
	return withSecurityHeaders(Response.json({ error: "unauthorized" }, { status: 401 }));
}
