import { and, eq, gte, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getSession as getWebSession } from "@/lib/auth";
import type { UserResult } from "@/lib/auth/types";

interface AdminUser {
	userId: number;
	user: UserResult;
}

function parseCookie(cookie: string, name: string): string | null {
	const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]!) : null;
}

export async function getAdminUser(req: Request): Promise<AdminUser | null> {
	// 1) Try Authorization: Bearer <token>
	const auth = req.headers.get("authorization");
	if (auth?.startsWith("Bearer ")) {
		const token = auth.slice(7);
		const db = await getDb();

		const [row] = await db
			.select({
				token: schema.oauthAccessToken,
				user: schema.user,
			})
			.from(schema.oauthAccessToken)
			.where(and(eq(schema.oauthAccessToken.token, token), gte(schema.oauthAccessToken.expiresAt, new Date())))
			.innerJoin(schema.user, eq(schema.oauthAccessToken.userId, schema.user.id));

		if (row) {
			return {
				userId: row.token.userId!,
				user: row.user,
			};
		}

		// Also check PATs (long-lived tokens with no expiry in this context)
		const [patRow] = await db
			.select({
				pat: schema.personalAccessToken,
				user: schema.user,
			})
			.from(schema.personalAccessToken)
			.where(and(eq(schema.personalAccessToken.token, token), isNull(schema.personalAccessToken.revokedAt)))
			.innerJoin(schema.user, eq(schema.personalAccessToken.userId, schema.user.id));

		if (patRow) {
			const now = new Date();
			await db
				.update(schema.personalAccessToken)
				.set({ lastUsedAt: now })
				.where(eq(schema.personalAccessToken.id, patRow.pat.id));

			return {
				userId: patRow.user.id,
				user: {
					id: patRow.user.id,
					username: patRow.user.username,
					email: patRow.user.email,
					name: patRow.user.name,
					givenName: null,
					familyName: null,
					displayName: null,
					nickname: null,
					emailVerified: patRow.user.emailVerified,
					image: null,
					phoneNumber: patRow.user.phoneNumber,
					phoneNumberVerified: null,
					profileUrl: null,
					websiteUrl: null,
					address: null,
					externalId: null,
					preferredLanguage: null,
					locale: null,
					timezone: null,
					loginShell: null,
					gecos: null,
					roleId: patRow.user.roleId,
					createdAt: patRow.user.createdAt,
					updatedAt: patRow.user.updatedAt,
				},
			};
		}

		return null;
	}

	// 2) Fallback to session cookie
	const cookie = req.headers.get("cookie") ?? "";
	const sessionToken = parseCookie(cookie, "session_token");
	if (!sessionToken) {
		return null;
	}

	const session = await getWebSession(sessionToken);
	if (!session.success || !session.data) {
		return null;
	}

	return {
		userId: session.data.userId,
		user: session.data.user,
	};
}

export function unauthorized(): Response {
	return Response.json({ error: "unauthorized" }, { status: 401 });
}
