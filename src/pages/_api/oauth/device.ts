import { withSecurityHeaders } from "@/lib/http/response";
import { parseFormSafe } from "@/lib/http/validate";
import { deviceFormSchema } from "@/lib/schemas/oauth";
import { randomBytes } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getClientById } from "@/lib/oauth";

export async function POST(req: Request): Promise<Response> {
	const parsed = await parseFormSafe(req, deviceFormSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const clientId = parsed.client_id;
	const scope = parsed.scope;

	const client = await getClientById(clientId);
	if (!client) {
		return withSecurityHeaders(Response.json({ error: "unauthorized_client" }, { status: 400 }));
	}

	const db = await getDb();

	const [total] = await db.select({ value: count() }).from(schema.client).where(eq(schema.client.type, "device_grant"));

	if ((total?.value ?? 0) >= 100) {
		return withSecurityHeaders(Response.json({ error: "too_many_requests" }, { status: 429 }));
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

	return withSecurityHeaders(
		Response.json({
			device_code: deviceCode,
			user_code: userCode,
			verification_uri: verificationUri,
			verification_uri_complete: `${verificationUri}?user_code=${userCode}`,
			expires_in: expiresIn,
			interval: 5,
		}),
	);
}
