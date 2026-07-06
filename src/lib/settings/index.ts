import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";

const CACHE_TTL_SETTING = 300; // 5 minutes — settings change infrequently

export const KNOWN_SETTINGS = new Set(["primary_color", "disable_registration"]);

function settingKey(name: string): string {
	return `setting:${name}`;
}

function settingsAllKey(): string {
	return "settings:all";
}

/** Read a single setting by name. Returns `null` if not set. */
export async function getSetting(name: string): Promise<string | null> {
	const cache = await getCache();
	const cacheKey = settingKey(name);
	const cached = await cache.get<string>(cacheKey);
	if (cached !== null) {
		return cached;
	}

	const db = await getDb();
	const [row] = await db
		.select({ value: schema.setting.value })
		.from(schema.setting)
		.where(eq(schema.setting.key, name));

	if (!row) {
		return null;
	}

	await cache.set(cacheKey, row.value, CACHE_TTL_SETTING);
	return row.value;
}

/** Read all settings as a flat `{ [key]: value }` object. */
export async function getSettings(): Promise<Record<string, string>> {
	const cache = await getCache();
	const cached = await cache.get<Record<string, string>>(settingsAllKey());
	if (cached !== null) {
		return cached;
	}

	const db = await getDb();
	const rows = await db.select().from(schema.setting);

	const result: Record<string, string> = {};
	for (const row of rows) {
		result[row.key] = row.value;
	}

	await cache.set(settingsAllKey(), result, CACHE_TTL_SETTING);
	return result;
}

/** Upsert a single setting. */
export async function setSetting(name: string, value: string): Promise<void> {
	const db = await getDb();

	await db
		.insert(schema.setting)
		.values({ key: name, value, updatedAt: new Date() })
		.onConflictDoUpdate({ target: schema.setting.key, set: { value, updatedAt: new Date() } });

	const cache = await getCache();
	await cache.delete(settingKey(name));
	await cache.delete(settingsAllKey());
}

/** Seed default settings if they don't exist. */
export async function seedDefaultSettings(): Promise<void> {
	const db = await getDb();
	const defaults: Record<string, string> = {
		primary_color: "#22c55e",
		disable_registration: "false",
	};

	for (const [key, value] of Object.entries(defaults)) {
		await db.insert(schema.setting).values({ key, value }).onConflictDoNothing({ target: schema.setting.key });
	}
}
