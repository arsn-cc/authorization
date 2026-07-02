import { withSecurityHeaders } from "@/lib/http/response";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getAccountUser, unauthorized } from "../../auth";
import { generateBackupCodes, hashBackupCode } from "@/lib/auth/totp";
import { invalidateUser } from "@/lib/auth/cache";

export async function GET(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const db = await getDb();
	const [user] = await db
		.select({ totpBackupCodes: schema.user.totpBackupCodes })
		.from(schema.user)
		.where(eq(schema.user.id, authed.userId));

	if (!user) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	if (!user.totpBackupCodes) {
		return withSecurityHeaders(Response.json({ codes: [] }));
	}

	// We can't return the original codes since they're hashed
	const count = JSON.parse(user.totpBackupCodes).length;
	return withSecurityHeaders(
		Response.json({ codeCount: count, message: "Backup codes are only shown once upon generation" }),
	);
}

export async function POST(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const backupCodes = generateBackupCodes();
	const hashedBackupCodes = JSON.stringify(backupCodes.map(hashBackupCode));

	const db = await getDb();
	await db
		.update(schema.user)
		.set({ totpBackupCodes: hashedBackupCodes, updatedAt: new Date() })
		.where(eq(schema.user.id, authed.userId));

	await invalidateUser({ id: authed.userId, username: authed.user.username, email: authed.user.email });

	return withSecurityHeaders(Response.json({ codes: backupCodes }));
}
