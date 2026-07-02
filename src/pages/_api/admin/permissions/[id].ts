import { withSecurityHeaders } from "@/lib/http/response";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "../auth";

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.PermissionsRead);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const [permission] = await db
		.select()
		.from(schema.permission)
		.where(eq(schema.permission.id, Number(params.id)));

	if (!permission) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}
	return withSecurityHeaders(Response.json(permission));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.PermissionsWrite);
	if (result instanceof Response) {
		return result;
	}

	const body = (await req.json()) as Record<string, unknown>;
	const db = await getDb();
	const updates: Record<string, unknown> = {};

	if (body.name !== undefined) {
		updates.name = body.name;
	}
	if (body.description !== undefined) {
		updates.description = body.description === null ? null : body.description;
	}

	const [updated] = await db
		.update(schema.permission)
		.set(updates)
		.where(eq(schema.permission.id, Number(params.id)))
		.returning({ id: schema.permission.id, name: schema.permission.name });

	if (!updated) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}
	return withSecurityHeaders(Response.json(updated));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.PermissionsDelete);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const { rowCount } = await db.delete(schema.permission).where(eq(schema.permission.id, Number(params.id)));

	if (!rowCount) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}
	return withSecurityHeaders(new Response(null, { status: 204 }));
}
