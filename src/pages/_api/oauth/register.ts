import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";

export async function POST(req: Request): Promise<Response> {
	const body = (await req.json()) as Record<string, unknown>;

	const clientId = body.client_id as string | undefined;
	const clientName = body.client_name as string | undefined;
	const redirectUris = body.redirect_uris as string[] | undefined;
	const grantTypes = body.grant_types as string[] | undefined;
	const tokenEndpointAuthMethod = body.token_endpoint_auth_method as string | undefined;

	if (!clientName || !redirectUris?.length) {
		return Response.json({ error: "invalid_client_metadata" }, { status: 400 });
	}

	const db = await getDb();
	const id = clientId ?? crypto.randomUUID();
	const secret = crypto.randomUUID();

	const [inserted] = await db
		.insert(schema.client)
		.values({
			clientId: id,
			type: "oauth",
			clientSecret: secret,
			name: clientName,
			redirectUris: redirectUris.join(","),
			grants: (grantTypes ?? ["authorization_code"]).join(","),
			scopes: "openid profile email",
			tokenEndpointAuthMethod: tokenEndpointAuthMethod ?? "client_secret_basic",
			clientIdIssuedAt: new Date(),
		})
		.returning();

	if (!inserted) {
		return Response.json({ error: "server_error" }, { status: 500 });
	}

	return Response.json(
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
	);
}
