import { randomBytes } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getClientById } from "@/lib/oauth";

export async function POST(req: Request): Promise<Response> {
	const form = await req.formData();
	const clientId = form.get("client_id") as string;
	const scope = (form.get("scope") as string) ?? "";

	if (!clientId) {
		return Response.json({ error: "invalid_request" }, { status: 400 });
	}

	const client = await getClientById(clientId);
	if (!client) {
		return Response.json({ error: "unauthorized_client" }, { status: 400 });
	}

	const db = await getDb();

	const [total] = await db.select({ value: count() }).from(schema.client).where(eq(schema.client.type, "device_grant"));

	if ((total?.value ?? 0) >= 100) {
		return Response.json({ error: "too_many_requests" }, { status: 429 });
	}

	const deviceCode = randomBytes(32).toString("hex");
	const userCode = randomBytes(6).toString("base64url").toUpperCase();
	const verificationUri = process.env.OAUTH_DEVICE_VERIFICATION_URI ?? `${new URL(req.url).origin}/device`;
	const expiresIn = 600;

	await db.insert(schema.client).values({
		clientId: `device:${deviceCode}`,
		type: "device_grant",
		name: `Device Grant ${userCode}`,
		scopes: scope || "openid",
		grants: "urn:ietf:params:oauth:grant-type:device_code",
		redirectUris: verificationUri,
		accessTokenTtl: expiresIn,
	});

	return Response.json({
		device_code: deviceCode,
		user_code: userCode,
		verification_uri: verificationUri,
		verification_uri_complete: `${verificationUri}?user_code=${userCode}`,
		expires_in: expiresIn,
		interval: 5,
	});
}
