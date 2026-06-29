import { eq, and, gte, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getAccountUser, unauthorized } from "./auth";

export async function GET(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const db = await getDb();
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

	const sessions = await db
		.select({
			id: schema.session.id,
			ip: schema.session.ip,
			userAgent: schema.session.userAgent,
			location: schema.session.location,
			deviceType: schema.session.deviceType,
			os: schema.session.os,
			browser: schema.session.browser,
			createdAt: schema.session.createdAt,
			expires: schema.session.expires,
			usedAt: schema.session.usedAt,
			isCurrent: schema.session.token,
		})
		.from(schema.session)
		.where(and(eq(schema.session.userId, authed.userId), gte(schema.session.createdAt, thirtyDaysAgo)))
		.orderBy(desc(schema.session.createdAt));

	const result = sessions.map((s) => ({
		id: s.id,
		ip: s.ip,
		userAgent: s.userAgent,
		location: s.location,
		deviceType: s.deviceType,
		os: s.os,
		browser: s.browser,
		createdAt: s.createdAt,
		expires: s.expires,
		usedAt: s.usedAt,
		isCurrent: authed.sessionToken !== null && s.isCurrent === authed.sessionToken,
	}));

	return Response.json({ data: result });
}
