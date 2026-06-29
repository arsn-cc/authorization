import { getUser, updateUser, deleteUser } from "@/lib/scim";

export async function GET(_req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const user = await getUser(Number(params.id));
	if (!user) {
		return Response.json(
			{ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "User not found", status: 404 },
			{ status: 404 },
		);
	}
	return Response.json(user);
}

export async function PUT(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const body = (await req.json()) as Record<string, unknown>;
	const user = await updateUser(Number(params.id), body as Parameters<typeof updateUser>[1]);
	return Response.json(user);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const body = (await req.json()) as Record<string, unknown>;
	const operations = (body.Operations ?? body.operations) as
		| Array<{ op: string; path?: string; value?: unknown }>
		| undefined;
	if (operations) {
		const user = await updateUser(Number(params.id), { operations } as Parameters<typeof updateUser>[1]);
		return Response.json(user);
	}
	const user = await updateUser(Number(params.id), body as Parameters<typeof updateUser>[1]);
	return Response.json(user);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }): Promise<Response> {
	await deleteUser(Number(params.id));
	return new Response(null, { status: 204 });
}
