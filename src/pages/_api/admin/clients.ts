import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe } from "@/lib/http/validate";
import { createClientSchema } from "@/lib/schemas/admin";
import { count, eq, asc, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/utils";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";

export async function GET(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.ClientsRead);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const url = new URL(req.url);
	const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
	const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("per_page")) || 20));
	const type = url.searchParams.get("type");
	const sort = url.searchParams.get("sort") ?? "id";
	const order = url.searchParams.get("order") ?? "desc";

	const conditions = type ? eq(schema.client.type, type) : undefined;

	const [totalResult] = await db.select({ value: count() }).from(schema.client).where(conditions);
	const total = totalResult?.value ?? 0;

	const orderColumn =
		sort === "name"
			? schema.client.name
			: sort === "type"
				? schema.client.type
				: sort === "clientId"
					? schema.client.clientId
					: schema.client.id;
	const orderDir = order === "asc" ? asc : desc;

	const clients = await db
		.select({
			id: schema.client.id,
			clientId: schema.client.clientId,
			type: schema.client.type,
			name: schema.client.name,
			redirectUris: schema.client.redirectUris,
			grants: schema.client.grants,
			scopes: schema.client.scopes,
			requireConsent: schema.client.requireConsent,
			createdAt: schema.client.createdAt,
		})
		.from(schema.client)
		.where(conditions)
		.orderBy(orderDir(orderColumn))
		.limit(perPage)
		.offset((page - 1) * perPage);

	return withSecurityHeaders(
		Response.json({ data: clients, total, page, perPage, totalPages: Math.ceil(total / perPage) }),
	);
}

export async function POST(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.ClientsWrite);
	if (result instanceof Response) {
		return result;
	}

	const parsed = await parseJsonSafe(req, createClientSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const db = await getDb();
	const [inserted] = await db
		.insert(schema.client)
		.values({
			clientId: parsed.clientId,
			type: parsed.type,
			name: parsed.name,
			clientSecret: parsed.clientSecret ? hashToken(parsed.clientSecret) : null,
			redirectUris: parsed.redirectUris ?? null,
			grants: parsed.grants ?? null,
			scopes: parsed.scopes,
			requireConsent: parsed.requireConsent === false ? 0 : 1,
			pkceRequired: parsed.pkceRequired === true ? 1 : parsed.pkceRequired === false ? 0 : null,
			accessTokenTtl: parsed.accessTokenTtl ?? null,
			refreshTokenRotationEnabled:
				parsed.refreshTokenRotationEnabled === true ? 1 : parsed.refreshTokenRotationEnabled === false ? 0 : null,
			reuseRefreshTokens: parsed.reuseRefreshTokens === true ? 1 : parsed.reuseRefreshTokens === false ? 0 : null,
			tokenEndpointAuthMethod: parsed.tokenEndpointAuthMethod ?? null,
			dpopBound: parsed.dpopBound === true ? 1 : parsed.dpopBound === false ? 0 : null,
			entityId: parsed.entityId ?? null,
			acsUrl: parsed.acsUrl ?? null,
			samlCertificate: parsed.samlCertificate ?? null,
			samlBinding: parsed.samlBinding ?? null,
		})
		.returning({
			id: schema.client.id,
			clientId: schema.client.clientId,
			type: schema.client.type,
			name: schema.client.name,
		});

	return withSecurityHeaders(Response.json(inserted, { status: 201 }));
}
