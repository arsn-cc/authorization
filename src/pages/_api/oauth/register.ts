import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe, isSecureRedirectUri } from "@/lib/http/validate";
import { clientRegisterSchema } from "@/lib/schemas/oauth";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/utils";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";

export async function POST(req: Request): Promise<Response> {
	const authResult = await requirePermission(req, AdminPermission.ClientsWrite);
	if (authResult instanceof Response) {
		return authResult;
	}

	const parsed = await parseJsonSafe(req, clientRegisterSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const clientId = parsed.client_id;
	const clientName = parsed.client_name;
	const redirectUris = parsed.redirect_uris;
	const grantTypes = parsed.grant_types;
	const tokenEndpointAuthMethod = parsed.token_endpoint_auth_method;

	for (const uri of redirectUris) {
		if (!isSecureRedirectUri(uri)) {
			return withSecurityHeaders(
				Response.json(
					{ error: "invalid_redirect_uri", error_description: "Redirect URI must use https (or http://localhost)" },
					{ status: 400 },
				),
			);
		}
	}

	const db = await getDb();
	const id = clientId ?? randomBytes(16).toString("hex");
	const secret = randomBytes(32).toString("hex");

	const [inserted] = await db
		.insert(schema.client)
		.values({
			clientId: id,
			type: "oauth",
			clientSecret: hashToken(secret),
			name: clientName,
			redirectUris: redirectUris.join(","),
			grants: (grantTypes ?? ["authorization_code"]).join(","),
			scopes: "openid profile email",
			tokenEndpointAuthMethod: tokenEndpointAuthMethod ?? "client_secret_basic",
			clientIdIssuedAt: new Date(),
		})
		.returning();

	if (!inserted) {
		return withSecurityHeaders(Response.json({ error: "server_error" }, { status: 500 }));
	}

	return withSecurityHeaders(
		Response.json(
			{
				client_id: inserted.clientId,
				client_secret: secret,
				client_name: inserted.name,
				redirect_uris: inserted.redirectUris?.split(",") ?? [],
				grant_types: inserted.grants?.split(",") ?? ["authorization_code"],
				token_endpoint_auth_method: inserted.tokenEndpointAuthMethod ?? "client_secret_basic",
				client_id_issued_at: Math.floor((inserted.clientIdIssuedAt ?? new Date()).getTime() / 1000),
				client_secret_expires_at: 0,
			},
			{ status: 201 },
		),
	);
}
