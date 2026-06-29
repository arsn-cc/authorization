import { listGroups, createGroup, type ScimSearchParams } from "@/lib/scim";

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
	const result = await listGroups(params);
	return Response.json(result);
}

export async function POST(req: Request): Promise<Response> {
	const body = (await req.json()) as Record<string, unknown>;
	const group = await createGroup(body as Parameters<typeof createGroup>[0]);
	return Response.json(group, { status: 201 });
}
