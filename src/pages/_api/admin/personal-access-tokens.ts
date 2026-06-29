import { and, count, eq, desc, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "./auth";

export async function GET(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.TokensRead);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const url = new URL(req.url);
	const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
	const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("per_page")) || 20));
	const userId = url.searchParams.get("userId");
	const showRevoked = url.searchParams.get("showRevoked") === "true";

	const conditions: ReturnType<typeof eq | typeof isNull>[] = [];
	if (!showRevoked) {
		conditions.push(isNull(schema.personalAccessToken.revokedAt));
	}
	if (userId) {
		conditions.push(eq(schema.personalAccessToken.userId, Number(userId)));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [totalResult] = await db.select({ value: count() }).from(schema.personalAccessToken).where(where);
	const total = totalResult?.value ?? 0;

	const tokens = await db
		.select({
			id: schema.personalAccessToken.id,
			userId: schema.personalAccessToken.userId,
			username: schema.user.username,
			name: schema.personalAccessToken.name,
			scopes: schema.personalAccessToken.scopes,
			lastUsedAt: schema.personalAccessToken.lastUsedAt,
			expiresAt: schema.personalAccessToken.expiresAt,
			revokedAt: schema.personalAccessToken.revokedAt,
			createdAt: schema.personalAccessToken.createdAt,
		})
		.from(schema.personalAccessToken)
		.where(where)
		.leftJoin(schema.user, eq(schema.personalAccessToken.userId, schema.user.id))
		.orderBy(desc(schema.personalAccessToken.createdAt))
		.limit(perPage)
		.offset((page - 1) * perPage);

	return Response.json({ data: tokens, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.TokensWrite);
	if (result instanceof Response) {
		return result;
	}

	const body = (await req.json()) as Record<string, unknown>;
	const userId = body.userId ? Number(body.userId) : result.userId;
	const name = body.name as string;

	if (!name || typeof name !== "string") {
		return Response.json({ error: "missing_name" }, { status: 400 });
	}

	const db = await getDb();
	const token = `pat_${randomBytes(32).toString("hex")}`;
	const scopes = (body.scopes as string) ?? "admin:read";
	const expiresIn = body.expiresInDays ? Number(body.expiresInDays) : null;

	const [inserted] = await db
		.insert(schema.personalAccessToken)
		.values({
			userId,
			token,
			name,
			scopes,
			expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 86400000) : null,
		})
		.returning({
			id: schema.personalAccessToken.id,
			name: schema.personalAccessToken.name,
			scopes: schema.personalAccessToken.scopes,
			expiresAt: schema.personalAccessToken.expiresAt,
		});

	return Response.json({ ...inserted, token }, { status: 201 });
}
