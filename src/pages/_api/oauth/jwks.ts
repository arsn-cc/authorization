import { getJwks } from "@/lib/oauth";

export async function GET(): Promise<Response> {
	const jwks = await getJwks();
	return Response.json(jwks, {
		headers: { "cache-control": "public, max-age=3600" },
	});
}
