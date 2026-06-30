import { authenticateClient, getTokenIntrospection } from "@/lib/oauth";

function clientCredentialsFromBasicAuth(req: Request): { clientId: string; clientSecret: string } | null {
	const auth = req.headers.get("authorization");
	if (!auth?.startsWith("Basic ")) {
		return null;
	}
	const decoded = atob(auth.slice(6));
	const colon = decoded.indexOf(":");
	if (colon === -1 || colon + 1 >= decoded.length) {
		return null;
	}
	return { clientId: decoded.slice(0, colon), clientSecret: decoded.slice(colon + 1) };
}

export async function POST(req: Request): Promise<Response> {
	const form = await req.formData();
	const token = form.get("token") as string;

	if (!token) {
		return Response.json({ error: "invalid_request" }, { status: 400 });
	}

	const formClientId = form.get("client_id") as string | undefined;
	const formClientSecret = form.get("client_secret") as string | undefined;
	const basic = clientCredentialsFromBasicAuth(req);

	const clientId = basic?.clientId ?? formClientId;
	const clientSecret = formClientSecret ?? basic?.clientSecret;

	if (!clientId) {
		return Response.json({ error: "invalid_client" }, { status: 401 });
	}

	const client = await authenticateClient(clientId, clientSecret);
	if (!client) {
		return Response.json({ error: "invalid_client" }, { status: 401 });
	}

	const result = await getTokenIntrospection(token, clientId);
	return Response.json(result);
}
