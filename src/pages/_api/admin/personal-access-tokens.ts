import { withSecurityHeaders } from "@/lib/http/response";
import { z } from "zod";
import { parseJsonSafe } from "@/lib/http/validate";
import { createPatSchema } from "@/lib/schemas/admin";
import { and, count, eq, desc, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/utils";
import { requirePermission, AdminPermission } from "./auth";

const createPatBodySchema = createPatSchema.extend({
	userId: z.number().optional(),
	expiresInDays: z.number().optional(),
});

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

	return withSecurityHeaders(
		Response.json({ data: tokens, total, page, perPage, totalPages: Math.ceil(total / perPage) }),
	);
}

export async function POST(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.TokensWrite);
	if (result instanceof Response) {
		return result;
	}

	const parsed = await parseJsonSafe(req, createPatBodySchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const targetUserId = parsed.userId ?? result.userId;

	if (targetUserId !== result.userId) {
		const writeCheck = await requirePermission(req, AdminPermission.UsersWrite);
		if (writeCheck instanceof Response) {
			return writeCheck;
		}
	}

	const userId = targetUserId;
	const db = await getDb();
	const token = `pat_${randomBytes(32).toString("hex")}`;
	const { name, scopes } = parsed;
	const expiresIn = parsed.expiresInDays ?? null;

	const [inserted] = await db
		.insert(schema.personalAccessToken)
		.values({
			userId,
			token,
			tokenHash: hashToken(token),
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

	return withSecurityHeaders(Response.json({ ...inserted, token }, { status: 201 }));
}
