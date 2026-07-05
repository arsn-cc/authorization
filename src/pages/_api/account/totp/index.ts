import { withSecurityHeaders } from "@/lib/http/response";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getAccountUser, unauthorized } from "@/lib/auth/account-auth";
import {
	generateTotpSecret,
	generateTotpUri,
	verifyTotpCode,
	generateBackupCodes,
	hashBackupCode,
} from "@/lib/auth/totp";
import { invalidateUser } from "@/lib/auth/cache";
import { parseJsonSafe } from "@/lib/http/validate";
import { totpVerifySchema } from "@/lib/schemas/auth";

export async function GET(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const db = await getDb();
	const [user] = await db
		.select({
			totpSecret: schema.user.totpSecret,
			totpEnabled: schema.user.totpEnabled,
			totpBackupCodes: schema.user.totpBackupCodes,
		})
		.from(schema.user)
		.where(eq(schema.user.id, authed.userId));

	if (!user) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	return withSecurityHeaders(
		Response.json({
			enabled: Boolean(user.totpEnabled),
			hasSecret: Boolean(user.totpSecret),
			hasBackupCodes: Boolean(user.totpBackupCodes && JSON.parse(user.totpBackupCodes).length > 0),
		}),
	);
}

export async function POST(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const db = await getDb();
	const [user] = await db
		.select({ username: schema.user.username })
		.from(schema.user)
		.where(eq(schema.user.id, authed.userId));

	if (!user) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	const secret = generateTotpSecret();
	const uri = generateTotpUri(secret, user.username);

	await db
		.update(schema.user)
		.set({ totpSecret: secret, totpEnabled: 0, updatedAt: new Date() })
		.where(eq(schema.user.id, authed.userId));

	await invalidateUser({ id: authed.userId, username: authed.user.username });

	return withSecurityHeaders(Response.json({ secret, uri }));
}

export async function PUT(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const body = await parseJsonSafe(req, totpVerifySchema);
	if (body instanceof Response) {
		return body;
	}

	const db = await getDb();
	const [user] = await db
		.select({ totpSecret: schema.user.totpSecret })
		.from(schema.user)
		.where(eq(schema.user.id, authed.userId));

	if (!user || !user.totpSecret) {
		return withSecurityHeaders(Response.json({ error: "TOTP not initialized" }, { status: 400 }));
	}

	if (!verifyTotpCode(user.totpSecret, body.code)) {
		return withSecurityHeaders(Response.json({ error: "Invalid code" }, { status: 400 }));
	}

	const backupCodes = generateBackupCodes();
	const hashedBackupCodes = JSON.stringify(backupCodes.map(hashBackupCode));

	await db
		.update(schema.user)
		.set({ totpEnabled: 1, totpBackupCodes: hashedBackupCodes, updatedAt: new Date() })
		.where(eq(schema.user.id, authed.userId));

	await invalidateUser({ id: authed.userId, username: authed.user.username });

	return withSecurityHeaders(Response.json({ enabled: true, backupCodes }));
}

export async function DELETE(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const db = await getDb();
	await db
		.update(schema.user)
		.set({ totpSecret: null, totpEnabled: 0, totpBackupCodes: null, updatedAt: new Date() })
		.where(eq(schema.user.id, authed.userId));

	await invalidateUser({ id: authed.userId, username: authed.user.username });

	return withSecurityHeaders(Response.json({ enabled: false }));
}
