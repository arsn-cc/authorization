import { withSecurityHeaders } from "@/lib/http/response";
import { parseFormSafe } from "@/lib/http/validate";
import { revokeFormSchema } from "@/lib/schemas/oauth";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/utils";
import { authenticateClient } from "@/lib/oauth";
import { deleteCachedOAuthAccessToken, deleteCachedOAuthRefreshToken } from "@/lib/auth/cache";

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
	const parsed = await parseFormSafe(req, revokeFormSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const token = parsed.token;
	const clientId = parsed.client_id;
	const clientSecret = parsed.client_secret ?? clientSecretFromBasicAuth(req);

	const client = await authenticateClient(clientId, clientSecret);
	if (!client) {
		return withSecurityHeaders(Response.json({ error: "invalid_client" }, { status: 401 }));
	}

	const db = await getDb();
	const tokenHash = hashToken(token);

	await Promise.all([
		db
			.delete(schema.oauthAccessToken)
			.where(and(eq(schema.oauthAccessToken.tokenHash, tokenHash), eq(schema.oauthAccessToken.clientId, clientId))),
		db
			.delete(schema.oauthRefreshToken)
			.where(and(eq(schema.oauthRefreshToken.tokenHash, tokenHash), eq(schema.oauthRefreshToken.clientId, clientId))),
		deleteCachedOAuthAccessToken(token),
		deleteCachedOAuthRefreshToken(token),
	]);

	return withSecurityHeaders(new Response(null, { status: 200 }));
}
