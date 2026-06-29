import { eq } from "drizzle-orm";
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

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const authError = await requireAdmin(req);
	if (authError) {
		return authError;
	}

	const db = await getDb();
	const id = Number(params.id) || params.id;
	const [client] = await db
		.select()
		.from(schema.client)
		.where(typeof id === "number" ? eq(schema.client.id, id) : eq(schema.client.clientId, id));

	if (!client) {
		return Response.json({ error: "not_found" }, { status: 404 });
	}

	return Response.json(client);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const authError = await requireAdmin(req);
	if (authError) {
		return authError;
	}

	const body = (await req.json()) as Record<string, unknown>;
	const db = await getDb();
	const id = Number(params.id) || params.id;
	const condition = typeof id === "number" ? eq(schema.client.id, id) : eq(schema.client.clientId, id);

	const allowedFields = [
		"name",
		"clientSecret",
		"redirectUris",
		"grants",
		"scopes",
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
		"casLoginUrl",
		"casLogoutUrl",
		"casServiceTicketTtl",
	] as const;

	const updates: Record<string, unknown> = {};
	for (const field of allowedFields) {
		if (body[field] !== undefined) {
			const val = body[field];
			if (
				field === "requireConsent" ||
				field === "pkceRequired" ||
				field === "dpopBound" ||
				field === "refreshTokenRotationEnabled" ||
				field === "reuseRefreshTokens"
			) {
				updates[field] = val === true ? 1 : val === false ? 0 : null;
			} else if (field === "accessTokenTtl" || field === "casServiceTicketTtl") {
				updates[field] = Number(val) || null;
			} else {
				updates[field] = val === null ? null : (val as string);
			}
		}
	}

	updates.updatedAt = new Date();

	const [updated] = await db
		.update(schema.client)
		.set(updates)
		.where(condition)
		.returning({ id: schema.client.id, clientId: schema.client.clientId, name: schema.client.name });

	if (!updated) {
		return Response.json({ error: "not_found" }, { status: 404 });
	}

	return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const authError = await requireAdmin(req);
	if (authError) {
		return authError;
	}

	const db = await getDb();
	const id = Number(params.id) || params.id;
	const condition = typeof id === "number" ? eq(schema.client.id, id) : eq(schema.client.clientId, id);

	await db.delete(schema.client).where(condition);
	return new Response(null, { status: 204 });
}
