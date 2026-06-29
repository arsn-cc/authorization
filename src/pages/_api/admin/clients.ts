import { count, eq, asc, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getAdminUser, unauthorized } from "./auth";

export async function GET(req: Request): Promise<Response> {
	const admin = await getAdminUser(req);
	if (!admin) {
		return unauthorized();
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

	return Response.json({ data: clients, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: Request): Promise<Response> {
	const admin = await getAdminUser(req);
	if (!admin) {
		return unauthorized();
	}

	const body = (await req.json()) as Record<string, unknown>;
	if (!body.clientId || !body.type || !body.name) {
		return Response.json({ error: "missing_required_fields" }, { status: 400 });
	}

	const db = await getDb();
	const [inserted] = await db
		.insert(schema.client)
		.values({
			clientId: body.clientId as string,
			type: body.type as string,
			name: body.name as string,
			clientSecret: (body.clientSecret as string | null) ?? null,
			redirectUris: (body.redirectUris as string | null) ?? null,
			grants: (body.grants as string | null) ?? null,
			scopes: (body.scopes ?? "openid profile email") as string,
			requireConsent: body.requireConsent === false ? 0 : 1,
			pkceRequired: body.pkceRequired === true ? 1 : body.pkceRequired === false ? 0 : null,
			accessTokenTtl: body.accessTokenTtl ? Number(body.accessTokenTtl) : null,
			refreshTokenRotationEnabled:
				body.refreshTokenRotationEnabled === true ? 1 : body.refreshTokenRotationEnabled === false ? 0 : null,
			reuseRefreshTokens: body.reuseRefreshTokens === true ? 1 : body.reuseRefreshTokens === false ? 0 : null,
			tokenEndpointAuthMethod: (body.tokenEndpointAuthMethod as string | null) ?? null,
			dpopBound: body.dpopBound === true ? 1 : body.dpopBound === false ? 0 : null,
			entityId: (body.entityId as string | null) ?? null,
			acsUrl: (body.acsUrl as string | null) ?? null,
			samlCertificate: (body.samlCertificate as string | null) ?? null,
			samlBinding: (body.samlBinding as string | null) ?? null,
		})
		.returning({
			id: schema.client.id,
			clientId: schema.client.clientId,
			type: schema.client.type,
			name: schema.client.name,
		});

	return Response.json(inserted, { status: 201 });
}
