import { withSecurityHeaders } from "@/lib/http/response";
export async function POST(_req: Request): Promise<Response> {
	return withSecurityHeaders(Response.json({ error: "not_implemented" }, { status: 501 }));
}
