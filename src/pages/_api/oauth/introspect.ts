import { getTokenIntrospection } from "@/lib/oauth";

export async function POST(req: Request): Promise<Response> {
	const form = await req.formData();
	const token = form.get("token") as string;
	const clientId = form.get("client_id") as string | undefined;

	if (!token) {
		return Response.json({ error: "invalid_request" }, { status: 400 });
	}

	const result = await getTokenIntrospection(token, clientId);
	return Response.json(result);
}
