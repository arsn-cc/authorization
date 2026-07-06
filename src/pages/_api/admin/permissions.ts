import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe, parsePagination } from "@/lib/http/validate";
import { createPermissionSchema } from "@/lib/schemas/admin";
import { count, ilike, or, asc, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";

export async function GET(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.PermissionsRead);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const url = new URL(req.url);
	const { page, perPage } = parsePagination(url);
	const search = url.searchParams.get("search");
	const sort = url.searchParams.get("sort") ?? "id";
	const order = url.searchParams.get("order") ?? "desc";

	const searchCond = search
		? or(ilike(schema.permission.name, `%${search}%`), ilike(schema.permission.description ?? "", `%${search}%`))
		: undefined;

	const [totalResult] = await db.select({ value: count() }).from(schema.permission).where(searchCond);
	const total = totalResult?.value ?? 0;

	const orderColumn = sort === "name" ? schema.permission.name : schema.permission.id;
	const orderDir = order === "asc" ? asc : desc;

	const permissions = await db
		.select()
		.from(schema.permission)
		.where(searchCond)
		.orderBy(orderDir(orderColumn))
		.limit(perPage)
		.offset((page - 1) * perPage);

	return withSecurityHeaders(
		Response.json({ data: permissions, total, page, perPage, totalPages: Math.ceil(total / perPage) }),
	);
}

export async function POST(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.PermissionsWrite);
	if (result instanceof Response) {
		return result;
	}

	const parsed = await parseJsonSafe(req, createPermissionSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const db = await getDb();
	const [inserted] = await db
		.insert(schema.permission)
		.values({
			name: parsed.name,
			description: parsed.description ?? null,
		})
		.returning({ id: schema.permission.id, name: schema.permission.name });

	return withSecurityHeaders(Response.json(inserted, { status: 201 }));
}
