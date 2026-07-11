import { withSecurityHeaders } from "@/lib/http/response";
import { parseFormSafe } from "@/lib/http/validate";
import { tokenRequestSchema } from "@/lib/schemas/oauth";
import { rateLimit, getClientIp } from "@/lib/http/rate-limit";
import {
	exchangeAuthorizationCode,
	exchangeClientCredentials,
	exchangeRefreshToken,
	type TokenRequest,
} from "@/lib/auth/oauth";

function clientCredentials(req: Request): string | null {
	const auth = req.headers.get("authorization");
	if (!auth || !auth.startsWith("Basic ")) {
		return null;
	}
	const decoded = atob(auth.slice(6));
	const colon = decoded.indexOf(":");
	return colon === -1 ? decoded : decoded.slice(0, colon);
}

export async function POST(req: Request): Promise<Response> {
	const rl = await rateLimit(`oauth:token:${getClientIp(req)}`, 120, 60);
	if (!rl.allowed) {
		return withSecurityHeaders(new Response(null, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }));
	}

	const contentType = req.headers.get("content-type") ?? "";

	if (contentType.includes("application/json")) {
		return withSecurityHeaders(
			Response.json(
				{
					error: "invalid_request",
					error_description: "JSON content type not accepted. Use application/x-www-form-urlencoded.",
				},
				{ status: 400 },
			),
		);
	}

	if (!contentType.includes("application/x-www-form-urlencoded")) {
		return withSecurityHeaders(Response.json({ error: "invalid_request" }, { status: 400 }));
	}

	const parsed = await parseFormSafe(req, tokenRequestSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const bodyClientId = parsed.client_id || clientCredentials(req) || "";
	const grantType = parsed.grant_type as TokenRequest["grantType"];
	const code = parsed.code;
	const redirectUri = parsed.redirect_uri;
	const codeVerifier = parsed.code_verifier;
	const refreshTokenParam = parsed.refresh_token;
	const scope = parsed.scope;
	let clientSecret = parsed.client_secret;

	if (!clientSecret) {
		const auth = req.headers.get("authorization");
		if (auth?.startsWith("Basic ")) {
			const decoded = atob(auth.slice(6));
			const colon = decoded.indexOf(":");
			if (colon !== -1 && colon + 1 < decoded.length) {
				clientSecret = decoded.slice(colon + 1);
			}
		}
	}

	const tokenRequest: TokenRequest = {
		grantType,
		clientId: bodyClientId,
		...(code ? { code } : {}),
		...(redirectUri ? { redirectUri } : {}),
		...(clientSecret ? { clientSecret } : {}),
		...(codeVerifier ? { codeVerifier } : {}),
		...(refreshTokenParam ? { refreshToken: refreshTokenParam } : {}),
		...(scope ? { scope } : {}),
	};

	try {
		let response;
		switch (tokenRequest.grantType) {
			case "authorization_code":
				response = await exchangeAuthorizationCode(tokenRequest);
				break;
			case "client_credentials":
				response = await exchangeClientCredentials({
					clientId: tokenRequest.clientId,
					...(clientSecret ? { clientSecret } : {}),
					...(parsed.scope ? { scope: parsed.scope } : {}),
				});
				break;
			case "refresh_token":
				response = await exchangeRefreshToken(tokenRequest);
				break;
			default:
				return withSecurityHeaders(Response.json({ error: "unsupported_grant_type" }, { status: 400 }));
		}

		const result: Record<string, string | number> = {
			access_token: response.accessToken,
			token_type: response.tokenType,
			expires_in: response.expiresIn,
		};
		if (response.refreshToken) {
			result.refresh_token = response.refreshToken;
		}
		if (response.scope) {
			result.scope = response.scope;
		}
		if (response.idToken) {
			result.id_token = response.idToken;
		}
		return withSecurityHeaders(Response.json(result));
	} catch (e) {
		const message = e instanceof Error ? e.message : "server_error";
		return withSecurityHeaders(Response.json({ error: message }, { status: 400 }));
	}
}
