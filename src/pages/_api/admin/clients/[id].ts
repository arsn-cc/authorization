import { withSecurityHeaders } from "@/lib/http/response";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "../auth";

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.ClientsRead);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const [client] = await db
		.select()
		.from(schema.client)
		.where(eq(schema.client.id, Number(params.id)));

	if (!client) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	const { clientSecret: _secret, ...safe } = client;
	return withSecurityHeaders(Response.json(safe));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.ClientsWrite);
	if (result instanceof Response) {
		return result;
	}

	const body = (await req.json()) as Record<string, unknown>;
	const db = await getDb();
	const updates: Record<string, unknown> = {};

	const allowedFields = [
		"name",
		"redirectUris",
		"grants",
		"scopes",
		"clientSecret",
		"requireConsent",
		"pkceRequired",
		"accessTokenTtl",
		"refreshTokenRotationEnabled",
		"reuseRefreshTokens",
		"tokenEndpointAuthMethod",
		"dpopBound",
		"entityId",
		"acsUrl",
		"samlCertificate",
		"samlBinding",
	] as const;

	for (const field of allowedFields) {
		if (body[field] !== undefined) {
			const val = body[field];
			if (
				field === "requireConsent" ||
				field === "pkceRequired" ||
				field === "refreshTokenRotationEnabled" ||
				field === "reuseRefreshTokens" ||
				field === "dpopBound"
			) {
				updates[field] = val === true ? 1 : val === false ? 0 : null;
			} else if (field === "accessTokenTtl") {
				updates[field] = val ? Number(val) : null;
			} else {
				updates[field] = val === null ? null : (val as string);
			}
		}
	}

	const [updated] = await db
		.update(schema.client)
		.set(updates)
		.where(eq(schema.client.id, Number(params.id)))
		.returning({ id: schema.client.id, clientId: schema.client.clientId, name: schema.client.name });

	if (!updated) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	return withSecurityHeaders(Response.json(updated));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.ClientsDelete);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const { rowCount } = await db.delete(schema.client).where(eq(schema.client.id, Number(params.id)));

	if (!rowCount) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}
	return withSecurityHeaders(new Response(null, { status: 204 }));
}
