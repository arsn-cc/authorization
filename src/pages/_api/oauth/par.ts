import { getClientById, generateAuthorizationCode, type AuthorizationRequest } from "@/lib/oauth";
import { getSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth/utils";

function parseCookie(cookie: string, name: string): string | null {
	const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]!) : null;
}

export async function POST(req: Request): Promise<Response> {
	const form = await req.formData();
	const clientId = form.get("client_id") as string;
	const redirectUri = form.get("redirect_uri") as string;
	const scope = (form.get("scope") as string) ?? "openid";
	const stateParam = form.get("state") as string | null;
	const codeChallengeParam = form.get("code_challenge") as string | null;
	const codeChallengeMethodParam = form.get("code_challenge_method") as string | null;
	const nonceParam = form.get("nonce") as string | null;

	if (!clientId || !redirectUri) {
		return Response.json({ error: "invalid_request" }, { status: 400 });
	}

	const client = await getClientById(clientId);
	if (!client) {
		return Response.json({ error: "unauthorized_client" }, { status: 400 });
	}

	if (scope && !scope.split(" ").every((s) => client.scopes.split(" ").includes(s))) {
		return Response.json({ error: "invalid_scope" }, { status: 400 });
	}

	const cookie = req.headers.get("cookie") ?? "";
	const token = parseCookie(cookie, SESSION_COOKIE_NAME);
	let userId: number | undefined;
	let sessionId: number | undefined;

	if (token) {
		const session = await getSession(token);
		if (session.success && session.data) {
			userId = session.data.userId;
			sessionId = session.data.sessionId;
		}
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

	const code = await generateAuthorizationCode(authRequest, userId ?? 0, sessionId);

	return Response.json({
		request_uri: `urn:ietf:params:oauth:request_uri:${code}`,
		expires_in: 600,
	});
}
