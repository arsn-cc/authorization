import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { getSettings, setSetting } from "@/lib/settings";
import { requirePermission, AdminPermission } from "./auth";

export async function GET(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.SettingsRead);
	if (result instanceof Response) {
		return result;
	}

	const settings = await getSettings();
	return Response.json(settings);
}

export async function PATCH(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.SettingsWrite);
	if (result instanceof Response) {
		return result;
	}

	const body = (await req.json()) as Record<string, string | null | undefined>;
	const updated: Record<string, string> = {};
	const cache = await getCache();

	for (const [key, value] of Object.entries(body)) {
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

	return Response.json(updated);
}
