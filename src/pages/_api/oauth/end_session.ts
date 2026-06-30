import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { sessionKey, hashToken } from "@/lib/auth/utils";

function parseCookie(cookie: string, name: string): string | null {
	const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]!) : null;
}

export async function GET(req: Request): Promise<Response> {
	return handleEndSession(req);
}

export async function POST(req: Request): Promise<Response> {
	return handleEndSession(req);
}

async function handleEndSession(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const _idTokenHint = url.searchParams.get("id_token_hint");
	const postLogoutRedirectUri = url.searchParams.get("post_logout_redirect_uri");
	const state = url.searchParams.get("state");

	const cookie = req.headers.get("cookie") ?? "";
	const token = parseCookie(cookie, "session_token");

	if (token) {
		const db = await getDb();
		const cache = await getCache();

		const [session] = await db
			.select({ id: schema.session.id })
			.from(schema.session)
			.where(eq(schema.session.tokenHash, hashToken(token)));

		await Promise.all([
			db.delete(schema.session).where(eq(schema.session.tokenHash, hashToken(token))),
			cache.delete(sessionKey(token)),
			...(session
				? [
						db.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.sessionId, session.id)),
						db.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.sessionId, session.id)),
						db.delete(schema.oauthAuthorizationCode).where(eq(schema.oauthAuthorizationCode.sessionId, session.id)),
					]
				: []),
		]);
	}

	if (postLogoutRedirectUri) {
		const dest = new URL(postLogoutRedirectUri);
		if (state) {
			dest.searchParams.set("state", state);
		}
		return new Response(null, {
			status: 302,
			headers: {
				Location: dest.toString(),
				"Set-Cookie": "session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
			},
		});
	}

	return new Response(null, {
		status: 302,
		headers: {
			Location: "https://arsn.cc",
			"Set-Cookie": "session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
		},
	});
}
