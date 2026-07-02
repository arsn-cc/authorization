import { withSecurityHeaders } from "@/lib/http/response";
import { and, eq, gte, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { toUserResult } from "@/lib/auth/cache";
import { hashToken, parseCookie, SESSION_COOKIE_NAME } from "@/lib/auth/utils";
import type { UserResult } from "@/lib/auth/types";

interface AuthenticatedUser {
	userId: number;
	sessionToken: string | null;
	user: UserResult;
}

export async function getAccountUser(req: Request): Promise<AuthenticatedUser | null> {
	const auth = req.headers.get("authorization");
	if (auth?.startsWith("Bearer ")) {
		const token = auth.slice(7);
		const db = await getDb();

		const [row] = await db
			.select({ user: schema.user })
			.from(schema.oauthAccessToken)
			.where(
				and(
					eq(schema.oauthAccessToken.tokenHash, hashToken(token)),
					gte(schema.oauthAccessToken.expiresAt, new Date()),
				),
			)
			.innerJoin(schema.user, eq(schema.oauthAccessToken.userId, schema.user.id));

		if (row) {
			return {
				userId: row.user.id,
				sessionToken: null,
				user: toUserResult(row.user),
			};
		}

		const [patRow] = await db
			.select({ user: schema.user })
			.from(schema.personalAccessToken)
			.where(
				and(eq(schema.personalAccessToken.tokenHash, hashToken(token)), isNull(schema.personalAccessToken.revokedAt)),
			)
			.innerJoin(schema.user, eq(schema.personalAccessToken.userId, schema.user.id));

		if (patRow) {
			return {
				userId: patRow.user.id,
				sessionToken: null,
				user: toUserResult(patRow.user),
			};
		}

		return null;
	}

	const cookie = req.headers.get("cookie") ?? "";
	const sessionToken = parseCookie(cookie, SESSION_COOKIE_NAME);
	if (!sessionToken) {
		return null;
	}

	const session = await getSession(sessionToken);
	if (!session.success || !session.data) {
		return null;
	}

	return {
		userId: session.data.userId,
		sessionToken: session.data.token,
		user: session.data.user,
	};
}

export function unauthorized(): Response {
	return withSecurityHeaders(Response.json({ error: "unauthorized" }, { status: 401 }));
}
