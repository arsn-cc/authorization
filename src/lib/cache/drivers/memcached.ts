import type { Cache } from "../types";

function promisify<T>(fn: (cb: (err: unknown, result: T) => void) => void): Promise<T> {
	return new Promise((resolve, reject) => {
		fn((err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
}

export async function createMemcachedCache(url: string, defaultTtl: number): Promise<Cache> {
	const { default: Memcached } = await import("memcached");
	const client = new Memcached(url);

	return {
		async get<T>(key: string): Promise<T | null> {
			return promisify<string | null>((cb) => client.get(key, cb)).then((raw) => {
				if (raw === null || raw === undefined) {
					return null;
				}
				try {
					return JSON.parse(raw) as T;
				} catch {
					return raw as unknown as T;
				}
			});
		},

		async set(key: string, value: unknown, ttl?: number): Promise<void> {
			const serialized = typeof value === "string" ? value : JSON.stringify(value);
			const lifetime = (ttl ?? defaultTtl) * 1000;
			return promisify<void>((cb) => client.set(key, serialized, lifetime, cb));
		},

		async delete(key: string): Promise<void> {
			return promisify<void>((cb) => client.del(key, cb));
		},

		async clear(): Promise<void> {
			return promisify<void>((cb) => client.flush(cb));
		},

		async has(key: string): Promise<boolean> {
			const val = await promisify<string | null>((cb) => client.get(key, cb));
			return val !== null && val !== undefined;
		},
	};
}
