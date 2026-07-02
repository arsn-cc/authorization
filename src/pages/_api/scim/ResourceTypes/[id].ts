import { withSecurityHeaders } from "@/lib/http/response";
import { getScimResourceType } from "@/lib/scim";

export async function GET(_req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const resourceType = getScimResourceType(params.id);
	if (!resourceType) {
		return withSecurityHeaders(
			Response.json(
				{ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Resource type not found", status: 404 },
				{ status: 404 },
			),
		);
	}
	return withSecurityHeaders(Response.json(resourceType));
}
