import { withSecurityHeaders } from "@/lib/http/response";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "../auth";

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.TokensDelete);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const [updated] = await db
		.update(schema.personalAccessToken)
		.set({ revokedAt: new Date() })
		.where(eq(schema.personalAccessToken.id, Number(params.id)))
		.returning({ id: schema.personalAccessToken.id, revokedAt: schema.personalAccessToken.revokedAt });

	if (!updated) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	return withSecurityHeaders(Response.json(updated));
}
