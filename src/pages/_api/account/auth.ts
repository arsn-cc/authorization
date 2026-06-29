import { and, eq, gte, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import type { UserResult } from "@/lib/auth/types";

interface AuthenticatedUser {
	userId: number;
	sessionToken: string | null;
	user: UserResult;
}

function parseCookie(cookie: string, name: string): string | null {
	const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]!) : null;
}

export async function getAccountUser(req: Request): Promise<AuthenticatedUser | null> {
	const auth = req.headers.get("authorization");
	if (auth?.startsWith("Bearer ")) {
		const token = auth.slice(7);
		const db = await getDb();

		const [row] = await db
			.select({ user: schema.user })
			.from(schema.oauthAccessToken)
			.where(and(eq(schema.oauthAccessToken.token, token), gte(schema.oauthAccessToken.expiresAt, new Date())))
			.innerJoin(schema.user, eq(schema.oauthAccessToken.userId, schema.user.id));

		if (row) {
			return {
				userId: row.user.id,
				sessionToken: null,
				user: row.user,
			};
		}

		const [patRow] = await db
			.select({ user: schema.user })
			.from(schema.personalAccessToken)
			.where(and(eq(schema.personalAccessToken.token, token), isNull(schema.personalAccessToken.revokedAt)))
			.innerJoin(schema.user, eq(schema.personalAccessToken.userId, schema.user.id));

		if (patRow) {
			return {
				userId: patRow.user.id,
				sessionToken: null,
				user: patRow.user,
			};
		}

		return null;
	}

	const cookie = req.headers.get("cookie") ?? "";
	const sessionToken = parseCookie(cookie, "session_token");
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
	return Response.json({ error: "unauthorized" }, { status: 401 });
}
