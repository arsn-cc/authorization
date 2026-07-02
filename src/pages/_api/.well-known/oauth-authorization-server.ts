import { withSecurityHeaders } from "@/lib/http/response";
import { getDiscoveryDocument } from "@/lib/oauth";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const issuer = process.env.OAUTH_ISSUER ?? `${url.protocol}//${url.host}`;
	const doc = await getDiscoveryDocument(issuer);
	return withSecurityHeaders(
		Response.json({
			issuer: doc.issuer,
			authorization_endpoint: doc.authorizationEndpoint,
			token_endpoint: doc.tokenEndpoint,
			jwks_uri: doc.jwksUri,
			registration_endpoint: doc.registrationEndpoint,
			scopes_supported: doc.scopesSupported,
			response_types_supported: doc.responseTypesSupported,
			grant_types_supported: doc.grantTypesSupported,
			token_endpoint_auth_methods_supported: doc.tokenEndpointAuthMethodsSupported,
			token_endpoint_auth_signing_alg_values_supported: doc.tokenEndpointAuthSigningAlgValuesSupported,
			code_challenge_methods_supported: doc.codeChallengeMethodsSupported,
		}),
	);
}
