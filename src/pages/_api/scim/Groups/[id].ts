import { getGroup, deleteGroup } from "@/lib/scim";

export async function GET(_req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const group = await getGroup(Number(params.id));
	if (!group) {
		return Response.json(
			{ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Group not found", status: 404 },
			{ status: 404 },
		);
	}
	return Response.json(group);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }): Promise<Response> {
	await deleteGroup(Number(params.id));
	return new Response(null, { status: 204 });
}

export async function PATCH(): Promise<Response> {
	return Response.json({ error: "not_implemented" }, { status: 501 });
}
