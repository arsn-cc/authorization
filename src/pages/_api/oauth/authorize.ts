import { getClientById, generateAuthorizationCode, type AuthorizationRequest } from "@/lib/oauth";
import { getSession } from "@/lib/auth";

function parseCookie(cookie: string, name: string): string | null {
	const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]!) : null;
}

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const responseType = url.searchParams.get("response_type");
	const clientId = url.searchParams.get("client_id");
	const redirectUri = url.searchParams.get("redirect_uri");
	const scope = url.searchParams.get("scope") ?? "openid";
	const stateParam = url.searchParams.get("state");
	const codeChallengeParam = url.searchParams.get("code_challenge");
	const codeChallengeMethodParam = url.searchParams.get(
		"code_challenge_method",
	) as AuthorizationRequest["codeChallengeMethod"];
	const nonceParam = url.searchParams.get("nonce");

	if (responseType !== "code") {
		return Response.json(
			{ error: "unsupported_response_type" },
			{ status: 400, headers: { "content-type": "application/json" } },
		);
	}

	if (!clientId || !redirectUri) {
		return Response.json(
			{ error: "invalid_request" },
			{ status: 400, headers: { "content-type": "application/json" } },
		);
	}

	const client = await getClientById(clientId);
	if (!client) {
		return Response.json(
			{ error: "unauthorized_client" },
			{ status: 400, headers: { "content-type": "application/json" } },
		);
	}

	if (
		!client.redirectUris
			?.split(",")
			.map((u) => u.trim())
			.includes(redirectUri)
	) {
		return Response.json(
			{ error: "invalid_redirect_uri" },
			{ status: 400, headers: { "content-type": "application/json" } },
		);
	}

	if (scope && !scope.split(" ").every((s) => client.scopes.split(" ").includes(s))) {
		const dest = new URL(redirectUri);
		dest.searchParams.set("error", "invalid_scope");
		if (stateParam) {
			dest.searchParams.set("state", stateParam);
		}
		return new Response(null, { status: 302, headers: { Location: dest.toString() } });
	}

	const cookie = req.headers.get("cookie") ?? "";
	const token = parseCookie(cookie, "session_token");
	if (!token) {
		const loginUrl = new URL("/login", url.origin);
		loginUrl.searchParams.set("redirect", url.pathname + url.search);
		return new Response(null, { status: 302, headers: { Location: loginUrl.toString() } });
	}

	const session = await getSession(token);
	if (!session.success || !session.data) {
		const loginUrl = new URL("/login", url.origin);
		loginUrl.searchParams.set("redirect", url.pathname + url.search);
		return new Response(null, { status: 302, headers: { Location: loginUrl.toString() } });
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

	const code = await generateAuthorizationCode(authRequest, session.data.userId, session.data.sessionId);

	const dest = new URL(redirectUri);
	dest.searchParams.set("code", code);
	if (stateParam) {
		dest.searchParams.set("state", stateParam);
	}

	return new Response(null, { status: 302, headers: { Location: dest.toString() } });
}
