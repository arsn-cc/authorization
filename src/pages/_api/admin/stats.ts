import { count, gte } from "drizzle-orm";
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

export async function GET(req: Request): Promise<Response> {
	const authError = await requireAdmin(req);
	if (authError) {
		return authError;
	}

	const db = await getDb();
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

	const [userCount] = await db.select({ value: count() }).from(schema.user);
	const [sessionCount] = await db
		.select({ value: count() })
		.from(schema.session)
		.where(gte(schema.session.createdAt, thirtyDaysAgo));
	const [clientCount] = await db.select({ value: count() }).from(schema.client);
	const [activeTokenCount] = await db
		.select({ value: count() })
		.from(schema.oauthAccessToken)
		.where(gte(schema.oauthAccessToken.expiresAt, new Date()));

	return Response.json({
		users: { total: userCount?.value ?? 0 },
		sessions: { active30d: sessionCount?.value ?? 0 },
		clients: { total: clientCount?.value ?? 0 },
		tokens: { active: activeTokenCount?.value ?? 0 },
	});
}
