import { count, gte, asc, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

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
	const sort = url.searchParams.get("sort") ?? "createdAt";
	const order = url.searchParams.get("order") ?? "desc";

	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const conditions = gte(schema.session.createdAt, thirtyDaysAgo);

	const [totalResult] = await db.select({ value: count() }).from(schema.session).where(conditions);
	const total = totalResult?.value ?? 0;

	const orderColumn =
		sort === "expires" ? schema.session.expires : sort === "usedAt" ? schema.session.usedAt : schema.session.createdAt;
	const orderDir = order === "asc" ? asc : desc;

	const sessions = await db
		.select({
			id: schema.session.id,
			userId: schema.session.userId,
			userAgent: schema.session.userAgent,
			ip: schema.session.ip,
			location: schema.session.location,
			deviceType: schema.session.deviceType,
			createdAt: schema.session.createdAt,
			expires: schema.session.expires,
			usedAt: schema.session.usedAt,
		})
		.from(schema.session)
		.where(conditions)
		.orderBy(orderDir(orderColumn))
		.limit(perPage)
		.offset((page - 1) * perPage);

	return Response.json({ data: sessions, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}
