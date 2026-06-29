import { count, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getAdminUser, unauthorized } from "./auth";

export async function GET(req: Request): Promise<Response> {
	const admin = await getAdminUser(req);
	if (!admin) {
		return unauthorized();
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
	const [patCount] = await db.select({ value: count() }).from(schema.personalAccessToken);

	return Response.json({
		users: { total: userCount?.value ?? 0 },
		sessions: { active30d: sessionCount?.value ?? 0 },
		clients: { total: clientCount?.value ?? 0 },
		tokens: { active: activeTokenCount?.value ?? 0 },
		personalAccessTokens: { total: patCount?.value ?? 0 },
	});
}
