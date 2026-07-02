import { withSecurityHeaders } from "@/lib/http/response";
import { getScimServiceProviderConfig } from "@/lib/scim";

export async function GET(): Promise<Response> {
	return withSecurityHeaders(Response.json(getScimServiceProviderConfig()));
}
