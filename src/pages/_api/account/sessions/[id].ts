import { withSecurityHeaders } from "@/lib/http/response";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { sessionKeyFromHash, hashToken } from "@/lib/auth/utils";
import { getAccountUser, unauthorized } from "@/lib/auth/account-auth";

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const db = await getDb();
	const cache = await getCache();
	const sessionId = Number(params.id);

	const [session] = await db
		.select({ id: schema.session.id, tokenHash: schema.session.tokenHash })
		.from(schema.session)
		.where(and(eq(schema.session.id, sessionId), eq(schema.session.userId, authed.userId)));

	if (!session) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	if (authed.sessionToken !== null && session.tokenHash === hashToken(authed.sessionToken)) {
		return withSecurityHeaders(Response.json({ error: "cannot_revoke_current_session" }, { status: 400 }));
	}

	await Promise.all([
		db.delete(schema.session).where(eq(schema.session.id, session.id)),
		db.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.sessionId, session.id)),
		db.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.sessionId, session.id)),
		db.delete(schema.oauthAuthorizationCode).where(eq(schema.oauthAuthorizationCode.sessionId, session.id)),
		cache.delete(sessionKeyFromHash(session.tokenHash ?? "")),
	]);

	return withSecurityHeaders(new Response(null, { status: 204 }));
}
