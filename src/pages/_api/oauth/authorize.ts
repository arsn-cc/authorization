import { withSecurityHeaders } from "@/lib/http/response";
import { parseQuery } from "@/lib/http/validate";
import { authorizeQuerySchema } from "@/lib/schemas/oauth";
import { eq } from "drizzle-orm";
import { getClientById, generateAuthorizationCode, type AuthorizationRequest } from "@/lib/oauth";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { parseCookie, SESSION_COOKIE_NAME } from "@/lib/auth/utils";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const query = parseQuery(url, authorizeQuerySchema);

	const responseType = query.response_type;
	const clientId = query.client_id;
	const redirectUri = query.redirect_uri;
	const scope = query.scope ?? "openid";
	const stateParam = query.state;
	const codeChallengeParam = query.code_challenge;
	const codeChallengeMethodParam = query.code_challenge_method as AuthorizationRequest["codeChallengeMethod"];
	const nonceParam = query.nonce;

	if (responseType !== "code") {
		return withSecurityHeaders(
			Response.json(
				{ error: "unsupported_response_type" },
				{ status: 400, headers: { "content-type": "application/json" } },
			),
		);
	}

	if (!clientId || !redirectUri) {
		return withSecurityHeaders(
			Response.json({ error: "invalid_request" }, { status: 400, headers: { "content-type": "application/json" } }),
		);
	}

	const client = await getClientById(clientId);
	if (!client) {
		return withSecurityHeaders(
			Response.json({ error: "unauthorized_client" }, { status: 400, headers: { "content-type": "application/json" } }),
		);
	}

	if (
		!client.redirectUris
			?.split(",")
			.map((u) => u.trim())
			.includes(redirectUri)
	) {
		return withSecurityHeaders(
			Response.json(
				{ error: "invalid_redirect_uri" },
				{ status: 400, headers: { "content-type": "application/json" } },
			),
		);
	}

	if (client.pkceRequired && !codeChallengeParam) {
		return withSecurityHeaders(
			Response.json(
				{ error: "invalid_request", error_description: "PKCE is required for this client" },
				{ status: 400 },
			),
		);
	}

	if (scope && !scope.split(" ").every((s) => client.scopes.split(" ").includes(s))) {
		const dest = new URL(redirectUri);
		dest.searchParams.set("error", "invalid_scope");
		if (stateParam) {
			dest.searchParams.set("state", stateParam);
		}
		return withSecurityHeaders(new Response(null, { status: 302, headers: { Location: dest.toString() } }));
	}

	const prompt = url.searchParams.get("prompt");
	const maxAge = url.searchParams.get("max_age");

	const cookie = req.headers.get("cookie") ?? "";
	const token = parseCookie(cookie, SESSION_COOKIE_NAME);

	let sessionUserId: number | null = null;
	let sessionIdVal: number | null = null;

	if (token) {
		const session = await getSession(token);
		if (session.success && session.data) {
			sessionUserId = session.data.userId;
			sessionIdVal = session.data.sessionId;
		}
	}

	if (prompt === "none" && !sessionUserId) {
		const dest = new URL(redirectUri);
		dest.searchParams.set("error", "login_required");
		if (stateParam) {
			dest.searchParams.set("state", stateParam);
		}
		return withSecurityHeaders(new Response(null, { status: 302, headers: { Location: dest.toString() } }));
	}

	if (!sessionUserId || prompt === "login") {
		const loginUrl = new URL("/login", url.origin);
		loginUrl.searchParams.set("redirect", url.pathname + url.search);
		return withSecurityHeaders(new Response(null, { status: 302, headers: { Location: loginUrl.toString() } }));
	}

	if (maxAge && sessionIdVal) {
		const db = await getDb();
		const [sessionRow] = await db
			.select({ createdAt: schema.session.createdAt })
			.from(schema.session)
			.where(eq(schema.session.id, sessionIdVal))
			.limit(1);
		if (sessionRow && Date.now() - sessionRow.createdAt.getTime() > parseInt(maxAge, 10) * 1000) {
			const loginUrl = new URL("/login", url.origin);
			loginUrl.searchParams.set("redirect", url.pathname + url.search);
			return withSecurityHeaders(new Response(null, { status: 302, headers: { Location: loginUrl.toString() } }));
		}
	}

	const authRequest: AuthorizationRequest = {
		responseType: "code",
		clientId,
		redirectUri,
		scope,
		...(stateParam ? { state: stateParam } : {}),
		...(codeChallengeParam ? { codeChallenge: codeChallengeParam } : {}),
		...(codeChallengeMethodParam ? { codeChallengeMethod: codeChallengeMethodParam } : {}),
		...(nonceParam ? { nonce: nonceParam } : {}),
	};

	const code = await generateAuthorizationCode(authRequest, sessionUserId, sessionIdVal ?? undefined);

	const dest = new URL(redirectUri);
	dest.searchParams.set("code", code);
	if (stateParam) {
		dest.searchParams.set("state", stateParam);
	}

	return withSecurityHeaders(new Response(null, { status: 302, headers: { Location: dest.toString() } }));
}
