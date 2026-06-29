import { getUserInfo, getClientById } from "@/lib/oauth";

function parseAuthHeader(req: Request): string | null {
	const auth = req.headers.get("authorization");
	if (!auth) {
		return null;
	}
	const match = auth.match(/^Bearer\s+(.+)$/i);
	return match ? match[1]! : null;
}

export async function GET(req: Request): Promise<Response> {
	return handleUserinfo(req);
}

export async function POST(req: Request): Promise<Response> {
	return handleUserinfo(req);
}

async function handleUserinfo(req: Request): Promise<Response> {
	const accessToken = parseAuthHeader(req);
	if (!accessToken) {
		return Response.json({ error: "invalid_token" }, { status: 401 });
	}

	const url = new URL(req.url);
	const clientId = url.searchParams.get("client_id") ?? "unknown";
	const client = await getClientById(clientId);
	if (!client) {
		return Response.json({ error: "invalid_client" }, { status: 401 });
	}

	const info = await getUserInfo(accessToken, client);
	if (!info) {
		return Response.json({ error: "invalid_token" }, { status: 401 });
	}

	return Response.json(info);
}
