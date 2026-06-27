import Redis from "ioredis";

export type { Cache, CacheEntry } from "./types";

let _cache: ReturnType<typeof createCache>;

function createCache() {
	const url = process.env.CACHE_URL || "redis://localhost:6379";
	const prefix = process.env.CACHE_KEY_PREFIX || "";

	const client = new Redis(url);

	function prefixed(key: string) {
		return prefix ? `${prefix}:${key}` : key;
	}

	return {
		async get<T>(key: string): Promise<T | null> {
			const raw = await client.get(prefixed(key));
			if (raw === null) {
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
				await client.setex(prefixed(key), ttl, serialized);
			} else {
				await client.set(prefixed(key), serialized);
			}
		},
		async delete(key: string): Promise<void> {
			await client.del(prefixed(key));
		},
		async clear(): Promise<void> {
			await client.flushdb();
		},
		async has(key: string): Promise<boolean> {
			const exists = await client.exists(prefixed(key));
			return exists === 1;
		},
	};
}

export async function getCache() {
	if (!_cache) {
		_cache = createCache();
	}
	return _cache;
}
