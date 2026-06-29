import { count, eq, ilike, or, asc, desc, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getSession, usernameToEmail, hashPassword, isValidUsername } from "@/lib/auth";

function parseCookie(cookie: string, name: string): string | null {
	const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]!) : null;
}

async function requireAdmin(req: Request): Promise<Response | null> {
	const cookie = req.headers.get("cookie") ?? "";
	const token = parseCookie(cookie, "session_token");
	if (!token) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}
	const session = await getSession(token);
	if (!session.success || !session.data) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}
	return null;
}

export async function GET(req: Request): Promise<Response> {
	const authError = await requireAdmin(req);
	if (authError) {
		return authError;
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

	return Response.json({
		data: users,
		total,
		page,
		perPage,
		totalPages: Math.ceil(total / perPage),
	});
}

export async function POST(req: Request): Promise<Response> {
	const authError = await requireAdmin(req);
	if (authError) {
		return authError;
	}

	const body = (await req.json()) as Record<string, string | undefined>;
	const username = body.username;
	const password = body.password;
	const name = body.name;

	if (!username || !isValidUsername(username)) {
		return Response.json({ error: "invalid_username" }, { status: 400 });
	}
	if (!password || password.length < 8) {
		return Response.json({ error: "password_too_short" }, { status: 400 });
	}

	const email = usernameToEmail(username);
	const db = await getDb();

	const [existing] = await db
		.select()
		.from(schema.user)
		.where(or(eq(schema.user.username, username), eq(schema.user.email, email)))
		.limit(1);
	if (existing) {
		return Response.json({ error: "user_exists" }, { status: 409 });
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

	return Response.json(inserted, { status: 201 });
}
