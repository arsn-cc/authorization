import { count, ilike, or, asc, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "./auth";

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

	return Response.json({ data: roles, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.RolesWrite);
	if (result instanceof Response) {
		return result;
	}

	const body = (await req.json()) as Record<string, unknown>;
	if (!body.name) {
		return Response.json({ error: "missing_name" }, { status: 400 });
	}

	const db = await getDb();
	const [inserted] = await db
		.insert(schema.role)
		.values({
			name: body.name as string,
			description: (body.description as string | null) ?? null,
			permissions: (body.permissions as string | null) ?? "[]",
		})
		.returning({ id: schema.role.id, name: schema.role.name });

	return Response.json(inserted, { status: 201 });
}
