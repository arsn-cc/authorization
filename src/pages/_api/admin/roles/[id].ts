import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe } from "@/lib/http/validate";
import { updateRoleSchema } from "@/lib/schemas/admin";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.RolesRead);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const [role] = await db
		.select()
		.from(schema.role)
		.where(eq(schema.role.id, Number(params.id)));

	if (!role) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}
	return withSecurityHeaders(Response.json(role));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.RolesWrite);
	if (result instanceof Response) {
		return result;
	}

	const parsed = await parseJsonSafe(req, updateRoleSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const db = await getDb();
	const updates: Record<string, unknown> = {};

	if (parsed.name !== undefined) {
		updates.name = parsed.name;
	}
	if (parsed.description !== undefined) {
		updates.description = parsed.description;
	}
	if (parsed.permissions !== undefined) {
		updates.permissions = parsed.permissions;
	}

	const [updated] = await db
		.update(schema.role)
		.set(updates)
		.where(eq(schema.role.id, Number(params.id)))
		.returning({ id: schema.role.id, name: schema.role.name });

	if (!updated) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}
	return withSecurityHeaders(Response.json(updated));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.RolesDelete);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const { rowCount } = await db.delete(schema.role).where(eq(schema.role.id, Number(params.id)));

	if (!rowCount) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}
	return withSecurityHeaders(new Response(null, { status: 204 }));
}
