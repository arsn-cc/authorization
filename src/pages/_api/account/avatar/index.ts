import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getStorage } from "@/lib/storage";
import { getAccountUser, unauthorized } from "@/lib/auth/account-auth";
import { invalidateUser } from "@/lib/auth/cache";
import { withSecurityHeaders } from "@/lib/http/response";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const form = await req.formData();
	const file = form.get("avatar");

	if (!file || !(file instanceof File)) {
		return withSecurityHeaders(Response.json({ error: "missing_file" }, { status: 400 }));
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		return withSecurityHeaders(Response.json({ error: "invalid_type" }, { status: 400 }));
	}

	if (file.size > MAX_SIZE) {
		return withSecurityHeaders(Response.json({ error: "file_too_large" }, { status: 400 }));
	}

	const ext = file.name.split(".").pop() ?? "jpg";
	const key = `avatars/${authed.userId}/${randomUUID()}.${ext}`;

	const storage = await getStorage();
	await storage.write(key, new Uint8Array(await file.arrayBuffer()), { contentType: file.type });

	const url = storage.url(key);
	if (!url) {
		return withSecurityHeaders(Response.json({ error: "storage_not_configured" }, { status: 500 }));
	}

	const db = await getDb();
	const [updated] = await db
		.update(schema.user)
		.set({ image: url, updatedAt: new Date() })
		.where(eq(schema.user.id, authed.userId))
		.returning({ image: schema.user.image });

	if (!updated) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	await invalidateUser({ id: authed.userId, username: authed.user.username, email: authed.user.email });

	return withSecurityHeaders(Response.json({ image: updated.image }));
}
