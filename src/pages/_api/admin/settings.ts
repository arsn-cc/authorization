import { withSecurityHeaders } from "@/lib/http/response";
import { parseJsonSafe } from "@/lib/http/validate";
import { updateSettingsSchema } from "@/lib/schemas/admin";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { getSettings, setSetting } from "@/lib/settings";
import { requirePermission, AdminPermission } from "@/lib/auth/admin-auth";

export async function GET(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.SettingsRead);
	if (result instanceof Response) {
		return result;
	}

	const settings = await getSettings();
	return withSecurityHeaders(Response.json(settings));
}

export async function PATCH(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.SettingsWrite);
	if (result instanceof Response) {
		return result;
	}

	const parsed = await parseJsonSafe(req, updateSettingsSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const updated: Record<string, string> = {};
	const cache = await getCache();

	for (const [key, value] of Object.entries(parsed)) {
		if (value === null) {
			const db = await getDb();
			await db.delete(schema.setting).where(eq(schema.setting.key, key));
			await cache.delete(`setting:${key}`);
			await cache.delete("settings:all");
			continue;
		}
		if (value !== undefined) {
			await setSetting(key, value);
			updated[key] = value;
		}
	}

	return withSecurityHeaders(Response.json(updated));
}
