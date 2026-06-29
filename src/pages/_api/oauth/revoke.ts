import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";

export async function POST(req: Request): Promise<Response> {
	const form = await req.formData();
	const token = form.get("token") as string;
	const _clientId = form.get("client_id") as string | null;

	if (!token) {
		return Response.json({ error: "invalid_request" }, { status: 400 });
	}

	const db = await getDb();

	await Promise.all([
		db.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.token, token)),
		db.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.token, token)),
	]);

	return new Response(null, { status: 200 });
}
