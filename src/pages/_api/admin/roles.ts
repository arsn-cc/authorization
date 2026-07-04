import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe } from "@/lib/http/validate";
import { createRoleSchema } from "@/lib/schemas/admin";
import { count, ilike, or, asc, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";

export async function GET(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.RolesRead);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const url = new URL(req.url);
	const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
	const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("per_page")) || 20));
	const search = url.searchParams.get("search");
	const sort = url.searchParams.get("sort") ?? "id";
	const order = url.searchParams.get("order") ?? "desc";

	const searchCond = search
		? or(ilike(schema.role.name, `%${search}%`), ilike(schema.role.description ?? "", `%${search}%`))
		: undefined;

	const [totalResult] = await db.select({ value: count() }).from(schema.role).where(searchCond);
	const total = totalResult?.value ?? 0;

	const orderColumn = sort === "name" ? schema.role.name : schema.role.id;
	const orderDir = order === "asc" ? asc : desc;

	const roles = await db
		.select({
			id: schema.role.id,
			name: schema.role.name,
			description: schema.role.description,
			permissions: schema.role.permissions,
		})
		.from(schema.role)
		.where(searchCond)
		.orderBy(orderDir(orderColumn))
		.limit(perPage)
		.offset((page - 1) * perPage);

	return withSecurityHeaders(
		Response.json({ data: roles, total, page, perPage, totalPages: Math.ceil(total / perPage) }),
	);
}

export async function POST(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.RolesWrite);
	if (result instanceof Response) {
		return result;
	}

	const parsed = await parseJsonSafe(req, createRoleSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const db = await getDb();
	const [inserted] = await db
		.insert(schema.role)
		.values({
			name: parsed.name,
			description: parsed.description ?? null,
			permissions: parsed.permissions,
		})
		.returning({ id: schema.role.id, name: schema.role.name });

	return withSecurityHeaders(Response.json(inserted, { status: 201 }));
}
