import { listUsers, createUser, type ScimSearchParams } from "@/lib/scim";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const countParam = url.searchParams.get("count");
	const startIndexParam = url.searchParams.get("startIndex");
	const filterParam = url.searchParams.get("filter");

	const params: ScimSearchParams = {
		...(countParam ? { count: Number(countParam) } : {}),
		...(startIndexParam ? { startIndex: Number(startIndexParam) } : {}),
		...(filterParam ? { filter: filterParam } : {}),
	};
	const result = await listUsers(params);
	return Response.json(result);
}

export async function POST(req: Request): Promise<Response> {
	const body = (await req.json()) as Record<string, unknown>;
	const user = await createUser(body as Parameters<typeof createUser>[0]);
	return Response.json(user, { status: 201 });
}
