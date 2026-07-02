import { withSecurityHeaders } from "@/lib/http/response";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { sessionKey } from "@/lib/auth/utils";
import { requirePermission, AdminPermission } from "../auth";

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.SessionsDelete);
	if (result instanceof Response) {
		return result;
	}

	const db = await getDb();
	const cache = await getCache();
	const [session] = await db
		.select()
		.from(schema.session)
		.where(eq(schema.session.id, Number(params.id)));

	if (!session) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	await Promise.all([
		db.delete(schema.session).where(eq(schema.session.id, session.id)),
		db.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.sessionId, session.id)),
		db.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.sessionId, session.id)),
		db.delete(schema.oauthAuthorizationCode).where(eq(schema.oauthAuthorizationCode.sessionId, session.id)),
		cache.delete(sessionKey(session.token)),
	]);

	return withSecurityHeaders(new Response(null, { status: 204 }));
}
