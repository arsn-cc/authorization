import { withSecurityHeaders } from "@/lib/http/response";
import { eq, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { parseCookie, sessionKey, hashToken, SESSION_COOKIE_NAME } from "@/lib/auth/utils";

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
	const token = parseCookie(cookie, SESSION_COOKIE_NAME);

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
		const db = await getDb();
		const clients = await db
			.select({ redirectUris: schema.client.redirectUris })
			.from(schema.client)
			.where(or(eq(schema.client.type, "oauth"), eq(schema.client.type, "oidc")));

		const allowedUris = clients.flatMap((c) => (c.redirectUris ?? "").split(",").map((u) => u.trim())).filter(Boolean);

		if (!allowedUris.includes(postLogoutRedirectUri)) {
			return withSecurityHeaders(
				new Response(null, {
					status: 302,
					headers: {
						Location: "/",
						"Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
					},
				}),
			);
		}

		const dest = new URL(postLogoutRedirectUri);
		if (state) {
			dest.searchParams.set("state", state);
		}
		return withSecurityHeaders(
			new Response(null, {
				status: 302,
				headers: {
					Location: dest.toString(),
					"Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
				},
			}),
		);
	}

	return withSecurityHeaders(
		new Response(null, {
			status: 302,
			headers: {
				Location: "/",
				"Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
			},
		}),
	);
}
