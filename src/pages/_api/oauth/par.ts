import { withSecurityHeaders } from "@/lib/http/response";
import { parseFormSafe } from "@/lib/http/validate";
import { parFormSchema } from "@/lib/schemas/oauth";
import { randomBytes } from "node:crypto";
import {
	generateAuthorizationCode,
	type AuthorizationRequest,
	authenticateClient,
	validateRedirectUri,
} from "@/lib/auth/oauth";
import { getSession } from "@/lib/auth";
import { parseCookie, SESSION_COOKIE_NAME } from "@/lib/auth/utils";

function clientSecretFromBasicAuth(req: Request): string | undefined {
	const auth = req.headers.get("authorization");
	if (!auth?.startsWith("Basic ")) {
		return undefined;
	}
	const decoded = atob(auth.slice(6));
	const colon = decoded.indexOf(":");
	if (colon !== -1 && colon + 1 < decoded.length) {
		return decoded.slice(colon + 1);
	}
	return undefined;
}

export async function POST(req: Request): Promise<Response> {
	const parsed = await parseFormSafe(req, parFormSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const clientId = parsed.client_id;
	const clientSecret = parsed.client_secret ?? clientSecretFromBasicAuth(req);
	const redirectUri = parsed.redirect_uri;
	const scope = parsed.scope ?? "openid";
	const stateParam = parsed.state ?? null;
	const codeChallengeParam = parsed.code_challenge ?? null;
	const codeChallengeMethodParam = parsed.code_challenge_method ?? null;
	const nonceParam = parsed.nonce ?? null;

	const client = await authenticateClient(clientId, clientSecret);
	if (!client) {
		return withSecurityHeaders(Response.json({ error: "unauthorized_client" }, { status: 400 }));
	}

	if (!validateRedirectUri(client, redirectUri)) {
		return withSecurityHeaders(Response.json({ error: "invalid_redirect_uri" }, { status: 400 }));
	}

	if (scope && !scope.split(" ").every((s) => client.scopes.split(" ").includes(s))) {
		return withSecurityHeaders(Response.json({ error: "invalid_scope" }, { status: 400 }));
	}

	const cookie = req.headers.get("cookie") ?? "";
	const token = parseCookie(cookie, SESSION_COOKIE_NAME);
	let userId: number;
	let sessionId: number | undefined;

	if (token) {
		const session = await getSession(token);
		if (session.success && session.data) {
			userId = session.data.userId;
			sessionId = session.data.sessionId;
		} else {
			return withSecurityHeaders(Response.json({ error: "login_required" }, { status: 401 }));
		}
	} else {
		return withSecurityHeaders(Response.json({ error: "login_required" }, { status: 401 }));
	}

	const authRequest: AuthorizationRequest = {
		responseType: "code",
		clientId,
		redirectUri,
		scope,
		...(stateParam ? { state: stateParam } : {}),
		...(codeChallengeParam ? { codeChallenge: codeChallengeParam } : {}),
		...(codeChallengeMethodParam === "S256" || codeChallengeMethodParam === "plain"
			? { codeChallengeMethod: codeChallengeMethodParam }
			: {}),
		...(nonceParam ? { nonce: nonceParam } : {}),
	};

	await generateAuthorizationCode(authRequest, userId, sessionId);

	return withSecurityHeaders(
		Response.json({
			request_uri: `urn:ietf:params:oauth:request_uri:${randomBytes(16).toString("hex")}`,
			expires_in: 600,
		}),
	);
}
