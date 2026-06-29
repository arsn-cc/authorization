import { count, eq, and, gte, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "./auth";

export async function GET(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.SessionsRead);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const url = new URL(req.url);
	const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
	const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("per_page")) || 20));
	const userId = url.searchParams.get("userId");
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

	const conditions = userId
		? and(eq(schema.session.userId, Number(userId)), gte(schema.session.createdAt, thirtyDaysAgo))
		: gte(schema.session.createdAt, thirtyDaysAgo);

	const [totalResult] = await db.select({ value: count() }).from(schema.session).where(conditions);
	const total = totalResult?.value ?? 0;

	const sessions = await db
		.select({
			id: schema.session.id,
			token: schema.session.token,
			userId: schema.session.userId,
			username: schema.user.username,
			ip: schema.session.ip,
			userAgent: schema.session.userAgent,
			createdAt: schema.session.createdAt,
			expires: schema.session.expires,
		})
		.from(schema.session)
		.where(conditions)
		.leftJoin(schema.user, eq(schema.session.userId, schema.user.id))
		.orderBy(desc(schema.session.createdAt))
		.limit(perPage)
		.offset((page - 1) * perPage);

	return Response.json({ data: sessions, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}
