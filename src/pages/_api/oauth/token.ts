import {
	exchangeAuthorizationCode,
	exchangeClientCredentials,
	exchangeRefreshToken,
	type TokenRequest,
} from "@/lib/oauth";

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
	const contentType = req.headers.get("content-type") ?? "";

	if (contentType.includes("application/json")) {
		return Response.json(
			{
				error: "invalid_request",
				error_description: "JSON content type not accepted. Use application/x-www-form-urlencoded.",
			},
			{ status: 400 },
		);
	}

	if (!contentType.includes("application/x-www-form-urlencoded")) {
		return Response.json({ error: "invalid_request" }, { status: 400 });
	}

	const form = await req.formData();
	const body = Object.fromEntries(form.entries()) as Record<string, string>;

	const bodyClientId = body.client_id || clientCredentials(req) || "";
	const grantType = body.grant_type as TokenRequest["grantType"];
	const code = body.code;
	const redirectUri = body.redirect_uri;
	const codeVerifier = body.code_verifier;
	const refreshTokenParam = body.refresh_token;
	const scope = body.scope;
	let clientSecret = body.client_secret;

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
					...(body.scope ? { scope: body.scope } : {}),
				});
				break;
			case "refresh_token":
				response = await exchangeRefreshToken(tokenRequest);
				break;
			default:
				return Response.json({ error: "unsupported_grant_type" }, { status: 400 });
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
		return Response.json(result);
	} catch (e) {
		const message = e instanceof Error ? e.message : "server_error";
		return Response.json({ error: message }, { status: 400 });
	}
}
