import { withSecurityHeaders } from "@/lib/http/response";
import { count, ilike, or, asc, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "./auth";

export async function GET(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.PermissionsRead);
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

	const body = (await req.json()) as Record<string, unknown>;
	if (!body.name) {
		return withSecurityHeaders(Response.json({ error: "missing_name" }, { status: 400 }));
	}

	const db = await getDb();
	const [inserted] = await db
		.insert(schema.permission)
		.values({
			name: body.name as string,
			description: (body.description as string | null) ?? null,
		})
		.returning({ id: schema.permission.id, name: schema.permission.name });

	return withSecurityHeaders(Response.json(inserted, { status: 201 }));
}
