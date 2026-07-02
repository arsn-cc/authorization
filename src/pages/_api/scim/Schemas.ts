import { withSecurityHeaders } from "@/lib/http/response";
import { getScimSchemas } from "@/lib/scim";

export async function GET(): Promise<Response> {
	return withSecurityHeaders(Response.json(getScimSchemas()));
}
