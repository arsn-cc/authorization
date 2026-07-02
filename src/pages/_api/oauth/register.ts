import { withSecurityHeaders } from "@/lib/http/response";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/utils";
import { requirePermission, AdminPermission } from "@/pages/_api/admin/auth";

export async function POST(req: Request): Promise<Response> {
	const authResult = await requirePermission(req, AdminPermission.ClientsWrite);
	if (authResult instanceof Response) {
		return authResult;
	}

	const body = (await req.json()) as Record<string, unknown>;

	const clientId = body.client_id as string | undefined;
	const clientName = body.client_name as string | undefined;
	const redirectUris = body.redirect_uris as string[] | undefined;
	const grantTypes = body.grant_types as string[] | undefined;
	const tokenEndpointAuthMethod = body.token_endpoint_auth_method as string | undefined;

	if (!clientName || !redirectUris?.length) {
		return withSecurityHeaders(Response.json({ error: "invalid_client_metadata" }, { status: 400 }));
	}

	for (const uri of redirectUris) {
		try {
			const parsed = new URL(uri);
			if (parsed.hash) {
				return withSecurityHeaders(
					Response.json(
						{ error: "invalid_redirect_uri", error_description: "Redirect URI must not contain a fragment" },
						{ status: 400 },
					),
				);
			}
			if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
				return withSecurityHeaders(Response.json({ error: "invalid_redirect_uri" }, { status: 400 }));
			}
		} catch {
			return withSecurityHeaders(Response.json({ error: "invalid_redirect_uri" }, { status: 400 }));
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
