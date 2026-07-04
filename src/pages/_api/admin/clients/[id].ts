import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe } from "@/lib/http/validate";
import { updateClientSchema } from "@/lib/schemas/admin";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/utils";
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

	const parsed = await parseJsonSafe(req, updateClientSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const db = await getDb();
	const updates: Record<string, unknown> = {};

	if (parsed.name !== undefined) {
		updates.name = parsed.name;
	}
	if (parsed.redirectUris !== undefined) {
		updates.redirectUris = parsed.redirectUris;
	}
	if (parsed.grants !== undefined) {
		updates.grants = parsed.grants;
	}
	if (parsed.scopes !== undefined) {
		updates.scopes = parsed.scopes;
	}
	if (parsed.clientSecret !== undefined) {
		updates.clientSecret = parsed.clientSecret === null ? null : hashToken(parsed.clientSecret);
	}
	if (parsed.requireConsent !== undefined) {
		updates.requireConsent = parsed.requireConsent === true ? 1 : parsed.requireConsent === false ? 0 : null;
	}
	if (parsed.pkceRequired !== undefined) {
		updates.pkceRequired = parsed.pkceRequired === true ? 1 : parsed.pkceRequired === false ? 0 : null;
	}
	if (parsed.accessTokenTtl !== undefined) {
		updates.accessTokenTtl = parsed.accessTokenTtl;
	}
	if (parsed.refreshTokenRotationEnabled !== undefined) {
		updates.refreshTokenRotationEnabled =
			parsed.refreshTokenRotationEnabled === true ? 1 : parsed.refreshTokenRotationEnabled === false ? 0 : null;
	}
	if (parsed.reuseRefreshTokens !== undefined) {
		updates.reuseRefreshTokens =
			parsed.reuseRefreshTokens === true ? 1 : parsed.reuseRefreshTokens === false ? 0 : null;
	}
	if (parsed.tokenEndpointAuthMethod !== undefined) {
		updates.tokenEndpointAuthMethod = parsed.tokenEndpointAuthMethod;
	}
	if (parsed.dpopBound !== undefined) {
		updates.dpopBound = parsed.dpopBound === true ? 1 : parsed.dpopBound === false ? 0 : null;
	}
	if (parsed.entityId !== undefined) {
		updates.entityId = parsed.entityId;
	}
	if (parsed.acsUrl !== undefined) {
		updates.acsUrl = parsed.acsUrl;
	}
	if (parsed.samlCertificate !== undefined) {
		updates.samlCertificate = parsed.samlCertificate;
	}
	if (parsed.samlBinding !== undefined) {
		updates.samlBinding = parsed.samlBinding;
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
