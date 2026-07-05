import { withSecurityHeaders } from "@/lib/http/response";
import { getDiscoveryDocument } from "@/lib/auth/oauth";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const issuer = process.env.OAUTH_ISSUER ?? `${url.protocol}//${url.host}`;
	const doc = await getDiscoveryDocument(issuer);
	return withSecurityHeaders(Response.json(doc));
}
