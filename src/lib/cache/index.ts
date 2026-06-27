import { getConfig } from "./config";
import type { Cache } from "./types";

export type { Cache, CacheEntry } from "./types";
export type { CacheType, CacheConfig } from "./config";
export { getConfig } from "./config";

let _cache: Cache | null = null;

export async function getCache(): Promise<Cache> {
	if (_cache) {
		return _cache;
	}

	const config = getConfig();

	switch (config.type) {
		case "memory": {
			const { createMemoryCache } = await import("./drivers/memory");
			_cache = createMemoryCache(config.defaultTtl);
			break;
		}
		case "lru": {
			const { createLruCache } = await import("./drivers/lru");
			_cache = await createLruCache(config.maxSize, config.defaultTtl);
			break;
		}
		case "redis": {
			const { createRedisCache } = await import("./drivers/redis");
			_cache = await createRedisCache(config.url ?? "redis://localhost:6379", config.keyPrefix);
			break;
		}
		case "upstash": {
			const { createUpstashCache } = await import("./drivers/upstash");
			_cache = await createUpstashCache(config.url ?? "", config.upstashToken ?? "", config.keyPrefix);
			break;
		}
		case "vercel-kv": {
			const { createVercelKvCache } = await import("./drivers/vercel-kv");
			_cache = await createVercelKvCache(config.keyPrefix);
			break;
		}
		case "memcached": {
			const { createMemcachedCache } = await import("./drivers/memcached");
			_cache = await createMemcachedCache(config.url ?? "localhost:11211", config.defaultTtl);
			break;
		}
		case "cf-kv": {
			const { createKvCache } = await import("./drivers/kv");
			const binding =
				(globalThis as Record<string, unknown>)[process.env.CF_KV_BINDING ?? ""] ?? process.env.CF_KV_BINDING;
			_cache = createKvCache(binding as never, config.keyPrefix);
			break;
		}
		case "cf-cache": {
			const { createCfCacheCache } = await import("./drivers/cf-cache");
			_cache = createCfCacheCache(config.keyPrefix, config.defaultTtl);
			break;
		}
		case "d1": {
			const { createD1Cache } = await import("./drivers/d1");
			const binding = (globalThis as Record<string, unknown>)[process.env.D1_BINDING ?? ""] ?? process.env.D1_BINDING;
			_cache = createD1Cache(binding as never, config.defaultTtl);
			break;
		}
		case "sqlite": {
			const { createSqliteCache } = await import("./drivers/sqlite");
			_cache = await createSqliteCache(config.filePath ?? "./.cache/cache.db", config.defaultTtl);
			break;
		}
		case "pg": {
			const { createPgCache } = await import("./drivers/pg");
			_cache = await createPgCache(config.connectionString ?? config.url ?? "", config.cacheTable, config.defaultTtl);
			break;
		}
		case "dynamodb": {
			const { createDynamoDBCache } = await import("./drivers/dynamodb");
			const ddbCfg: Record<string, unknown> = {
				tableName: config.cacheTable,
				defaultTtl: config.defaultTtl,
				...(config.region ? { region: config.region } : {}),
				...(config.endpoint ? { endpoint: config.endpoint } : {}),
				...(config.accessKeyId ? { accessKeyId: config.accessKeyId } : {}),
				...(config.secretAccessKey ? { secretAccessKey: config.secretAccessKey } : {}),
			};
			_cache = await createDynamoDBCache(ddbCfg as never);
			break;
		}
		case "etcd": {
			const { createEtcdCache } = await import("./drivers/etcd");
			_cache = await createEtcdCache({
				hosts: config.hosts,
				defaultTtl: config.defaultTtl,
				keyPrefix: config.keyPrefix,
			});
			break;
		}
		case "firebase": {
			const { createFirebaseCache } = await import("./drivers/firebase");
			_cache = await createFirebaseCache({
				databaseUrl: config.databaseUrl ?? "",
				defaultTtl: config.defaultTtl,
				keyPrefix: config.keyPrefix,
			});
			break;
		}
		case "fs": {
			const { createFsCache } = await import("./drivers/fs");
			_cache = await createFsCache(config.filePath ?? "./.cache");
			break;
		}
		default: {
			const _exhaustive: never = config.type;
			throw new Error(`Unsupported cache type: ${String(_exhaustive)}`);
		}
	}

	return _cache;
}
