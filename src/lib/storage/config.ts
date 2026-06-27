export type StorageType =
	| "fs"
	| "s3"
	| "r2"
	| "cf-kv"
	| "gcs"
	| "azure"
	| "supabase"
	| "webdav"
	| "sql"
	| "http"
	| "memory";

export interface StorageConfig {
	type: StorageType;
	baseDir: string;
	bucket: string | undefined;
	region: string | undefined;
	endpoint: string | undefined;
	publicUrlBase: string | undefined;
	accessKeyId: string | undefined;
	secretAccessKey: string | undefined;
	connectionString: string | undefined;
	tableName: string | undefined;
	username: string | undefined;
	password: string | undefined;
}

const ALIASES: Record<string, StorageType> = {
	filesystem: "fs",
	local: "fs",
	"cloudflare-kv": "cf-kv",
	"cloudflare-r2": "r2",
	"aws-s3": "s3",
	minio: "s3",
	"google-cloud-storage": "gcs",
	"azure-blob": "azure",
	"http-remote": "http",
};

export function getConfig(): StorageConfig {
	const raw = process.env.STORAGE_TYPE || "fs";
	const type = (ALIASES[raw] ?? raw) as StorageType;
	return {
		type,
		baseDir: process.env.STORAGE_BASE_DIR || "./uploads",
		bucket: process.env.STORAGE_BUCKET,
		region: process.env.STORAGE_REGION,
		endpoint: process.env.STORAGE_ENDPOINT,
		publicUrlBase: process.env.STORAGE_PUBLIC_URL,
		accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
		secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
		connectionString: process.env.STORAGE_CONNECTION_STRING,
		tableName: process.env.STORAGE_TABLE || "_files",
		username: process.env.STORAGE_USERNAME,
		password: process.env.STORAGE_PASSWORD,
	};
}
