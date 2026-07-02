import { withSecurityHeaders } from "@/lib/http/response";
import { getGroup, deleteGroup } from "@/lib/scim";
import { requirePermission, AdminPermission } from "@/pages/_api/admin/auth";

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersRead);
	if (result instanceof Response) {
		return result;
	}

	const group = await getGroup(Number(params.id));
	if (!group) {
		return withSecurityHeaders(
			Response.json(
				{ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Group not found", status: 404 },
				{ status: 404 },
			),
		);
	}
	return withSecurityHeaders(Response.json(group));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersDelete);
	if (result instanceof Response) {
		return result;
	}

	await deleteGroup(Number(params.id));
	return withSecurityHeaders(new Response(null, { status: 204 }));
}

export async function PATCH(): Promise<Response> {
	return withSecurityHeaders(Response.json({ error: "not_implemented" }, { status: 501 }));
}
