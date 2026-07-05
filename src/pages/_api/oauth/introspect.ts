import { withSecurityHeaders } from "@/lib/http/response";
import { parseFormSafe } from "@/lib/http/validate";
import { introspectFormSchema } from "@/lib/schemas/oauth";
import { authenticateClient, getTokenIntrospection } from "@/lib/auth/oauth";

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
	const parsed = await parseFormSafe(req, introspectFormSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const token = parsed.token;
	const formClientId = parsed.client_id;
	const formClientSecret = parsed.client_secret;
	const basic = clientCredentialsFromBasicAuth(req);

	const clientId = basic?.clientId ?? formClientId;
	const clientSecret = formClientSecret ?? basic?.clientSecret;

	if (!clientId) {
		return withSecurityHeaders(Response.json({ error: "invalid_client" }, { status: 401 }));
	}

	const client = await authenticateClient(clientId, clientSecret);
	if (!client) {
		return withSecurityHeaders(Response.json({ error: "invalid_client" }, { status: 401 }));
	}

	const result = await getTokenIntrospection(token, clientId);
	return withSecurityHeaders(Response.json(result));
}
