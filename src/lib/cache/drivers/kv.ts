import type { Cache } from "../types";

export interface KvBinding {
	get(key: string): Promise<string | null>;
	set(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
	delete(key: string): Promise<void>;
	list?(): Promise<{ keys: { name: string }[] }>;
}

export function createKvCache(binding: KvBinding, keyPrefix: string): Cache {
	const prefix = keyPrefix;

	function prefixed(key: string): string {
		return prefix ? `${prefix}:${key}` : key;
	}

	return {
		async get<T>(key: string): Promise<T | null> {
			const raw = await binding.get(prefixed(key));
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
			const options = ttl !== undefined && ttl > 0 ? { expirationTtl: ttl } : undefined;
			await binding.set(prefixed(key), serialized, options);
		},

		async delete(key: string): Promise<void> {
			await binding.delete(prefixed(key));
		},

		async clear(): Promise<void> {
			if (!binding.list) {
				return;
			}
			const { keys } = await binding.list();
			await Promise.all(keys.map((k) => binding.delete(k.name)));
		},

		async has(key: string): Promise<boolean> {
			const raw = await binding.get(prefixed(key));
			return raw !== null;
		},
	};
}
