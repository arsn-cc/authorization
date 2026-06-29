import { getDiscoveryDocument } from "@/lib/oauth";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const issuer = process.env.OAUTH_ISSUER ?? `${url.protocol}//${url.host}`;
	const doc = await getDiscoveryDocument(issuer);
	return Response.json(doc);
}
