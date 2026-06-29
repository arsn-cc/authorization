import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { requirePermission, AdminPermission } from "../../../auth";
import { invalidateUser } from "@/lib/auth/cache";
import { getCache } from "@/lib/cache";
import { sessionKey } from "@/lib/auth/utils";

export async function POST(req: Request, { params }: { params: { id: string } }): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersWrite);
	if (result instanceof Response) {
		return result;
	}

	const userId = Number(params.id);
	const db = await getDb();

	const [user] = await db
		.select({ id: schema.user.id, username: schema.user.username, email: schema.user.email })
		.from(schema.user)
		.where(eq(schema.user.id, userId));

	if (!user) {
		return Response.json({ error: "not_found" }, { status: 404 });
	}

	// Revoke all active sessions since TOTP reset is a security event
	const sessions = await db
		.select({ id: schema.session.id, token: schema.session.token })
		.from(schema.session)
		.where(eq(schema.session.userId, userId));

	const cache = await getCache();

	await Promise.all([
		db
			.update(schema.user)
			.set({ totpSecret: null, totpEnabled: 0, totpBackupCodes: null, updatedAt: new Date() })
			.where(eq(schema.user.id, userId)),
		db.delete(schema.session).where(eq(schema.session.userId, userId)),
		db.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.userId, userId)),
		db.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.userId, userId)),
		...sessions.map((s) => cache.delete(sessionKey(s.token))),
	]);

	await invalidateUser({ id: user.id, username: user.username, email: user.email });

	return Response.json({ success: true });
}
