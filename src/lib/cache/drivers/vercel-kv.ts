import type { Cache } from "../types";

export async function createVercelKvCache(keyPrefix: string): Promise<Cache> {
	const { kv } = await import("@vercel/kv");

	const prefix = keyPrefix;

	function prefixed(key: string): string {
		return prefix ? `${prefix}:${key}` : key;
	}

	return {
		async get<T>(key: string): Promise<T | null> {
			const raw = await kv.get<string>(prefixed(key));
			if (raw === null || raw === undefined) {
				return null;
			}
			try {
				return JSON.parse(raw) as T;
			} catch {
				return raw as unknown as T;
			}
		},

		async set(key: string, value: unknown, ttl?: number): Promise<void> {
			const serialized = typeof value === "string" ? value : JSON.stringify(value);
			if (ttl !== undefined && ttl > 0) {
				await kv.setex(prefixed(key), ttl, serialized);
			} else {
				await kv.set(prefixed(key), serialized);
			}
		},

		async delete(key: string): Promise<void> {
			await kv.del(prefixed(key));
		},

		async clear(): Promise<void> {
			await kv.flushall();
		},

		async has(key: string): Promise<boolean> {
			const exists = await kv.exists(prefixed(key));
			return exists === 1;
		},
	};
}
