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

	return Response.json(
		{
			client_id: clientId ?? crypto.randomUUID(),
			client_secret: crypto.randomUUID(),
			client_name: clientName,
			redirect_uris: redirectUris,
			grant_types: grantTypes ?? ["authorization_code"],
			token_endpoint_auth_method: tokenEndpointAuthMethod ?? "client_secret_basic",
			client_id_issued_at: Math.floor(Date.now() / 1000),
			client_secret_expires_at: 0,
		},
		{ status: 201 },
	);
}
