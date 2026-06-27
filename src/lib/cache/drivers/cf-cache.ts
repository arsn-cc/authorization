import type { Cache } from "../types";

export function createCfCacheCache(keyPrefix: string, defaultTtl: number): Cache {
	const prefix = keyPrefix;

	function cacheKey(key: string): Request {
		const url = prefix
			? `https://cache/${encodeURIComponent(prefix)}/${encodeURIComponent(key)}`
			: `https://cache/${encodeURIComponent(key)}`;
		return new Request(url);
	}

	return {
		async get<T>(key: string): Promise<T | null> {
			const cache = await caches.open("default");
			const response = await cache.match(cacheKey(key));
			if (!response) {
				return null;
			}
			const raw = await response.text();
			try {
				return JSON.parse(raw) as T;
			} catch {
				return raw as unknown as T;
			}
		},

		async set(key: string, value: unknown, ttl?: number): Promise<void> {
			const cache = await caches.open("default");
			const serialized = typeof value === "string" ? value : JSON.stringify(value);
			const t = ttl ?? defaultTtl;
			const response = new Response(serialized, {
				headers: {
					"Content-Type": "text/plain",
					"Cache-Control": t > 0 ? `public, max-age=${t}` : "public",
				},
			});
			await cache.put(cacheKey(key), response);
		},

		async delete(key: string): Promise<void> {
			const cache = await caches.open("default");
			await cache.delete(cacheKey(key));
		},

		async clear(): Promise<void> {
			const cache = await caches.open("default");
			const keys = await cache.keys();
			await Promise.all(keys.map((req) => cache.delete(req)));
		},

		async has(key: string): Promise<boolean> {
			const cache = await caches.open("default");
			const response = await cache.match(cacheKey(key));
			return response !== undefined;
		},
	};
}
