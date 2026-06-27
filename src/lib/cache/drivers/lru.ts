import type { Cache } from "../types";

interface LruEntry<T> {
	value: T;
	expiresAt: number | null;
}

function isExpired(entry: LruEntry<unknown>): boolean {
	return entry.expiresAt !== null && entry.expiresAt <= Date.now();
}

export async function createLruCache(maxSize: number, defaultTtl: number): Promise<Cache> {
	const { LRUCache } = await import("lru-cache");
	const store = new LRUCache<string, LruEntry<unknown>>({ max: maxSize });

	return {
		async get<T>(key: string): Promise<T | null> {
			const entry = store.get(key) as LruEntry<T> | undefined;
			if (!entry) {
				return null;
			}
			if (isExpired(entry)) {
				store.delete(key);
				return null;
			}
			return entry.value;
		},

		async set(key: string, value: unknown, ttl?: number): Promise<void> {
			const t = ttl ?? defaultTtl;
			store.set(key, {
				value,
				expiresAt: t > 0 ? Date.now() + t * 1000 : null,
			});
		},

		async delete(key: string): Promise<void> {
			store.delete(key);
		},

		async clear(): Promise<void> {
			store.clear();
		},

		async has(key: string): Promise<boolean> {
			const entry = store.get(key);
			if (!entry) {
				return false;
			}
			if (isExpired(entry)) {
				store.delete(key);
				return false;
			}
			return true;
		},
	};
}
