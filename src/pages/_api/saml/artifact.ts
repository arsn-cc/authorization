import { withSecurityHeaders } from "@/lib/http/response";
export async function GET(): Promise<Response> {
	return withSecurityHeaders(Response.json({ error: "not_implemented" }, { status: 501 }));
}
