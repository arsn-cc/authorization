import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { getSession } from "@/lib/auth";
import { sessionKey } from "@/lib/auth/utils";

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

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const authError = await requireAdmin(req);
	if (authError) {
		return authError;
	}

	const db = await getDb();
	const cache = await getCache();
	const sessionId = Number(params.id);

	const [session] = await db
		.select({ token: schema.session.token })
		.from(schema.session)
		.where(eq(schema.session.id, sessionId));

	if (!session) {
		return new Response(null, { status: 204 });
	}

	await Promise.all([
		db.delete(schema.session).where(eq(schema.session.id, sessionId)),
		cache.delete(sessionKey(session.token)),
		db.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.sessionId, sessionId)),
		db.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.sessionId, sessionId)),
		db.delete(schema.oauthAuthorizationCode).where(eq(schema.oauthAuthorizationCode.sessionId, sessionId)),
	]);

	return new Response(null, { status: 204 });
}
