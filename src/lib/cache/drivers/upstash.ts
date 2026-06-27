import type { Cache } from "../types";

export async function createUpstashCache(url: string, token: string, keyPrefix: string): Promise<Cache> {
	const { Redis } = await import("@upstash/redis/cloudflare");
	const client = new Redis({ url, token });

	const prefix = keyPrefix;

	function prefixed(key: string): string {
		return prefix ? `${prefix}:${key}` : key;
	}

	return {
		async get<T>(key: string): Promise<T | null> {
			const raw = await client.get<string>(prefixed(key));
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
				await client.setex(prefixed(key), ttl, serialized);
			} else {
				await client.set(prefixed(key), serialized);
			}
		},

		async delete(key: string): Promise<void> {
			await client.del(prefixed(key));
		},

		async clear(): Promise<void> {
			await client.flushall();
		},

		async has(key: string): Promise<boolean> {
			const exists = await client.exists(prefixed(key));
			return exists === 1;
		},
	};
}
