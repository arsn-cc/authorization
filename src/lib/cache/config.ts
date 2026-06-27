export type CacheType =
	| "memory"
	| "lru"
	| "redis"
	| "upstash"
	| "vercel-kv"
	| "memcached"
	| "cf-kv"
	| "cf-cache"
	| "d1"
	| "sqlite"
	| "pg"
	| "dynamodb"
	| "etcd"
	| "firebase"
	| "fs";

export interface CacheConfig {
	type: CacheType;
	url: string | undefined;
	filePath: string | undefined;
	keyPrefix: string;
	defaultTtl: number;
	maxSize: number;
	upstashToken: string | undefined;
	connectionString: string | undefined;
	cacheTable: string;
	hosts: string[];
	region: string | undefined;
	endpoint: string | undefined;
	accessKeyId: string | undefined;
	secretAccessKey: string | undefined;
	databaseUrl: string | undefined;
}

const ALIASES: Record<string, CacheType> = {
	mem: "memory",
	"cloudflare-kv": "cf-kv",
	"cloudflare-cache": "cf-cache",
	file: "fs",
	filesystem: "fs",
};

export function getConfig(): CacheConfig {
	const raw = process.env.CACHE_TYPE || "memory";
	const type = (ALIASES[raw] ?? raw) as CacheType;
	return {
		type,
		url: process.env.CACHE_URL,
		filePath: process.env.CACHE_FILE_PATH || "./.cache",
		keyPrefix: process.env.CACHE_KEY_PREFIX || "",
		defaultTtl: Number(process.env.CACHE_DEFAULT_TTL) || 300,
		maxSize: Number(process.env.CACHE_MAX_SIZE) || 500,
		upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN,
		connectionString: process.env.CACHE_CONNECTION_STRING,
		cacheTable: process.env.CACHE_TABLE || "_cache",
		hosts: (process.env.ETCD_HOSTS || "localhost:2379").split(","),
		region: process.env.CACHE_REGION,
		endpoint: process.env.CACHE_ENDPOINT,
		accessKeyId: process.env.CACHE_ACCESS_KEY_ID,
		secretAccessKey: process.env.CACHE_SECRET_ACCESS_KEY,
		databaseUrl: process.env.FIREBASE_DATABASE_URL,
	};
}
