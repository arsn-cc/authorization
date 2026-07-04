import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe } from "@/lib/http/validate";
import { createUserSchema } from "@/lib/schemas/admin";
import { count, eq, ilike, or, asc, desc, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { usernameToEmail, hashPassword, isValidUsername } from "@/lib/auth/utils";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";

export async function GET(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersRead);
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
		? or(
				ilike(schema.user.username, `%${search}%`),
				ilike(schema.user.email, `%${search}%`),
				ilike(schema.user.name ?? sql`''`, `%${search}%`),
			)
		: undefined;

	const [totalResult] = await db.select({ value: count() }).from(schema.user).where(searchCond);
	const total = totalResult?.value ?? 0;

	const orderColumn =
		sort === "email"
			? schema.user.email
			: sort === "username"
				? schema.user.username
				: sort === "createdAt"
					? schema.user.createdAt
					: schema.user.id;
	const orderDir = order === "asc" ? asc : desc;

	const users = await db
		.select({
			id: schema.user.id,
			username: schema.user.username,
			email: schema.user.email,
			name: schema.user.name,
			emailVerified: schema.user.emailVerified,
			roleId: schema.user.roleId,
			createdAt: schema.user.createdAt,
			updatedAt: schema.user.updatedAt,
		})
		.from(schema.user)
		.where(searchCond)
		.orderBy(orderDir(orderColumn))
		.limit(perPage)
		.offset((page - 1) * perPage);

	return withSecurityHeaders(
		Response.json({ data: users, total, page, perPage, totalPages: Math.ceil(total / perPage) }),
	);
}

export async function POST(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersWrite);
	if (result instanceof Response) {
		return result;
	}

	const parsed = await parseJsonSafe(req, createUserSchema);
	if (parsed instanceof Response) {
		return parsed;
	}
	const { username, password, name } = parsed;

	if (!username || !isValidUsername(username)) {
		return withSecurityHeaders(Response.json({ error: "invalid_username" }, { status: 400 }));
	}
	if (!password || password.length < 8) {
		return withSecurityHeaders(Response.json({ error: "password_too_short" }, { status: 400 }));
	}

	const email = usernameToEmail(username);
	const db = await getDb();

	const [existing] = await db
		.select()
		.from(schema.user)
		.where(or(eq(schema.user.username, username), eq(schema.user.email, email)))
		.limit(1);
	if (existing) {
		return withSecurityHeaders(Response.json({ error: "user_exists" }, { status: 409 }));
	}

	const [inserted] = await db
		.insert(schema.user)
		.values({
			username,
			email,
			passwordHash: hashPassword(password),
			name: name ?? null,
			emailVerified: new Date(),
		})
		.returning({
			id: schema.user.id,
			username: schema.user.username,
			email: schema.user.email,
			name: schema.user.name,
			emailVerified: schema.user.emailVerified,
			createdAt: schema.user.createdAt,
		});

	return withSecurityHeaders(Response.json(inserted, { status: 201 }));
}
