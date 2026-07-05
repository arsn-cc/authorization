import { withSecurityHeaders } from "@/lib/http/response";
import { listGroups, createGroup, type ScimSearchParams } from "@/lib/auth/scim";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";
import { parseJsonSafe } from "@/lib/http/validate";
import { z } from "zod";

const scimBodySchema = z.object({}).passthrough();

export async function GET(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersRead);
	if (result instanceof Response) {
		return result;
	}

	const url = new URL(req.url);
	const countParam = url.searchParams.get("count");
	const startIndexParam = url.searchParams.get("startIndex");
	const filterParam = url.searchParams.get("filter");

	const params: ScimSearchParams = {
		...(countParam ? { count: Number(countParam) } : {}),
		...(startIndexParam ? { startIndex: Number(startIndexParam) } : {}),
		...(filterParam ? { filter: filterParam } : {}),
	};
	const groups = await listGroups(params);
	return withSecurityHeaders(Response.json(groups));
}

export async function POST(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersWrite);
	if (result instanceof Response) {
		return result;
	}

	const parsed = await parseJsonSafe(req, scimBodySchema);
	if (parsed instanceof Response) {
		return parsed;
	}
	const group = await createGroup(parsed as Parameters<typeof createGroup>[0]);
	return withSecurityHeaders(Response.json(group, { status: 201 }));
}
