import { createLoginUrl } from "@/lib/cas";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const service = url.searchParams.get("service");

	if (!service) {
		return Response.json({ error: "missing_service_parameter" }, { status: 400 });
	}

	const loginUrl = createLoginUrl({ service: encodeURIComponent(service) });
	return new Response(null, { status: 302, headers: { Location: loginUrl } });
}
