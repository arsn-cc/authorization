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
	const [role] = await db
		.select()
		.from(schema.role)
		.where(eq(schema.role.id, Number(params.id)));

	if (!role) {
		return Response.json({ error: "not_found" }, { status: 404 });
	}

	return Response.json(role);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const authError = await requireAdmin(req);
	if (authError) {
		return authError;
	}

	const body = (await req.json()) as { name?: string; description?: string; permissions?: string[] };
	const db = await getDb();
	const roleId = Number(params.id);

	const updates: Record<string, unknown> = {};
	if (body.name !== undefined) {
		updates.name = body.name;
	}
	if (body.description !== undefined) {
		updates.description = body.description;
	}
	if (body.permissions !== undefined) {
		updates.permissions = JSON.stringify(body.permissions);
	}

	const [updated] = await db.update(schema.role).set(updates).where(eq(schema.role.id, roleId)).returning();

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
	await db.delete(schema.role).where(eq(schema.role.id, Number(params.id)));

	return new Response(null, { status: 204 });
}
