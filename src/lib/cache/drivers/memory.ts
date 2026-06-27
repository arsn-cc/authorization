import type { Cache, CacheEntry } from "../types";

export function createMemoryCache(defaultTtl: number): Cache {
	const store = new Map<string, CacheEntry<unknown>>();
	let timer: ReturnType<typeof setInterval> | null = null;

	function startCleanup() {
		if (timer !== null) {
			return;
		}
		timer = setInterval(() => {
			const now = Date.now();
			for (const [key, entry] of store) {
				if (entry.expiresAt !== null && entry.expiresAt <= now) {
					store.delete(key);
				}
			}
		}, 60_000);
		if (typeof timer === "object" && "unref" in timer) {
			timer.unref();
		}
	}

	startCleanup();

	return {
		async get<T>(key: string): Promise<T | null> {
			const entry = store.get(key) as CacheEntry<T> | undefined;
			if (!entry) {
				return null;
			}
			if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
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
			if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
				store.delete(key);
				return false;
			}
			return true;
		},
	};
}
