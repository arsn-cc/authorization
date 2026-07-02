import { withSecurityHeaders } from "@/lib/http/response";
import { getUser, updateUser, deleteUser } from "@/lib/scim";
import { requirePermission, AdminPermission } from "@/pages/_api/admin/auth";

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersRead);
	if (result instanceof Response) {
		return result;
	}

	const user = await getUser(Number(params.id));
	if (!user) {
		return withSecurityHeaders(
			Response.json(
				{ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "User not found", status: 404 },
				{ status: 404 },
			),
		);
	}
	return withSecurityHeaders(Response.json(user));
}

export async function PUT(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersWrite);
	if (result instanceof Response) {
		return result;
	}

	const body = (await req.json()) as Record<string, unknown>;
	const user = await updateUser(Number(params.id), body as Parameters<typeof updateUser>[1]);
	return withSecurityHeaders(Response.json(user));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersWrite);
	if (result instanceof Response) {
		return result;
	}

	const body = (await req.json()) as Record<string, unknown>;
	const operations = (body.Operations ?? body.operations) as
		| Array<{ op: string; path?: string; value?: unknown }>
		| undefined;
	if (operations) {
		const user = await updateUser(Number(params.id), { operations } as Parameters<typeof updateUser>[1]);
		return withSecurityHeaders(Response.json(user));
	}
	const user = await updateUser(Number(params.id), body as Parameters<typeof updateUser>[1]);
	return withSecurityHeaders(Response.json(user));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersDelete);
	if (result instanceof Response) {
		return result;
	}

	await deleteUser(Number(params.id));
	return withSecurityHeaders(new Response(null, { status: 204 }));
}
