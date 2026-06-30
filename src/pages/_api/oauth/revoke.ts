import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { authenticateClient } from "@/lib/oauth";

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
	const form = await req.formData();
	const token = form.get("token") as string;
	const clientId = form.get("client_id") as string | null;
	const clientSecret = (form.get("client_secret") as string | undefined) ?? clientSecretFromBasicAuth(req);

	if (!token || !clientId) {
		return Response.json({ error: "invalid_request" }, { status: 400 });
	}

	const client = await authenticateClient(clientId, clientSecret);
	if (!client) {
		return Response.json({ error: "invalid_client" }, { status: 401 });
	}

	const db = await getDb();

	await Promise.all([
		db.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.token, token)),
		db.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.token, token)),
	]);

	return new Response(null, { status: 200 });
}
