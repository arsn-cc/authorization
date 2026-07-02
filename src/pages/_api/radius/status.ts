import { withSecurityHeaders } from "@/lib/http/response";
export async function GET(): Promise<Response> {
	return withSecurityHeaders(
		Response.json({
			status: "ok",
			version: "1.0.0",
			protocols: ["RADIUS"],
		}),
	);
}
