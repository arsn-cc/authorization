import { withSecurityHeaders } from "@/lib/http/response";
import { getScimResourceTypes } from "@/lib/scim";

export async function GET(): Promise<Response> {
	return withSecurityHeaders(Response.json(getScimResourceTypes()));
}
