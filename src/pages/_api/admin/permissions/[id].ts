import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe } from "@/lib/http/validate";
import { updatePermissionSchema } from "@/lib/schemas/admin";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";

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

	const parsed = await parseJsonSafe(req, updatePermissionSchema);
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
