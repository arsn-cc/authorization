import { withSecurityHeaders } from "@/lib/http/response";
import { getJwks } from "@/lib/auth/oauth";

export async function GET(): Promise<Response> {
	const jwks = await getJwks();
	return withSecurityHeaders(
		Response.json(jwks, {
			headers: { "cache-control": "public, max-age=3600" },
		}),
	);
}
