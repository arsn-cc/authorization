import type { Cache } from "../types";

export async function createEtcdCache(config: {
	hosts: string[];
	defaultTtl: number;
	keyPrefix: string;
}): Promise<Cache> {
	const { Etcd3 } = await import("etcd3");
	const client = new Etcd3({ hosts: config.hosts });
	const prefix = config.keyPrefix;

	function prefixed(key: string): string {
		return prefix ? `${prefix}:${key}` : key;
	}

	return {
		async get<T>(key: string): Promise<T | null> {
			const raw = await client.get(prefixed(key));
			if (!raw) {
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
			const lease = ttl !== undefined && ttl > 0 ? await client.lease.grant(ttl) : undefined;
			if (lease) {
				await client.put(prefixed(key)).value(serialized).lease(lease).exec();
			} else {
				await client.put(prefixed(key)).value(serialized).exec();
			}
		},

		async delete(key: string): Promise<void> {
			await client.delete().key(prefixed(key)).exec();
		},

		async clear(): Promise<void> {
			if (prefix) {
				await client.delete().prefix(prefix).exec();
			} else {
				await client.delete().all().exec();
			}
		},

		async has(key: string): Promise<boolean> {
			const raw = await client.get(prefixed(key));
			return raw !== null;
		},
	};
}
