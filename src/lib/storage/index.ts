import { getConfig } from "./config";
import type { FileStorage } from "./types";

export type { FileStorage, FileMetadata } from "./types";
export type { StorageType, StorageConfig } from "./config";
export { getConfig } from "./config";

let _storage: FileStorage | null = null;

export async function getStorage(): Promise<FileStorage> {
	if (_storage) {
		return _storage;
	}

	const config = getConfig();

	switch (config.type) {
		case "fs": {
			const { createFsStorage } = await import("./drivers/fs");
			_storage = await createFsStorage(config.baseDir, config.publicUrlBase);
			break;
		}
		case "s3": {
			const { createS3Storage } = await import("./drivers/s3");
			_storage = await createS3Storage({
				bucket: config.bucket ?? "uploads",
				...(config.region ? { region: config.region } : {}),
				...(config.endpoint ? { endpoint: config.endpoint } : {}),
				...(config.accessKeyId ? { accessKeyId: config.accessKeyId } : {}),
				...(config.secretAccessKey ? { secretAccessKey: config.secretAccessKey } : {}),
				...(config.publicUrlBase ? { publicUrlBase: config.publicUrlBase } : {}),
			} as never);
			break;
		}
		case "r2": {
			const { createR2Storage } = await import("./drivers/r2");
			const binding = (globalThis as Record<string, unknown>)[process.env.R2_BINDING ?? ""] ?? process.env.R2_BINDING;
			_storage = createR2Storage(binding as never, config.publicUrlBase);
			break;
		}
		case "cf-kv": {
			const { createKvStorage } = await import("./drivers/kv");
			const binding =
				(globalThis as Record<string, unknown>)[process.env.CF_KV_BINDING ?? ""] ?? process.env.CF_KV_BINDING;
			_storage = createKvStorage(binding as never, config.publicUrlBase);
			break;
		}
		case "gcs": {
			const { createGcsStorage } = await import("./drivers/gcs");
			_storage = await createGcsStorage({
				bucket: config.bucket ?? "uploads",
				...(process.env.GOOGLE_APPLICATION_CREDENTIALS
					? { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS }
					: {}),
				...(config.publicUrlBase ? { publicUrlBase: config.publicUrlBase } : {}),
			} as never);
			break;
		}
		case "azure": {
			const { createAzureStorage } = await import("./drivers/azure");
			_storage = await createAzureStorage({
				connectionString: config.connectionString ?? "",
				containerName: config.bucket ?? "uploads",
				...(config.publicUrlBase ? { publicUrlBase: config.publicUrlBase } : {}),
			} as never);
			break;
		}
		case "supabase": {
			const { createSupabaseStorage } = await import("./drivers/supabase");
			_storage = await createSupabaseStorage({
				url: config.endpoint ?? "",
				anonKey: config.accessKeyId ?? "",
				bucket: config.bucket ?? "uploads",
				...(config.publicUrlBase ? { publicUrlBase: config.publicUrlBase } : {}),
			} as never);
			break;
		}
		case "webdav": {
			const { createWebdavStorage } = await import("./drivers/webdav");
			const wdCfg: Record<string, unknown> = {
				url: config.endpoint ?? "",
				...(config.username ? { username: config.username } : {}),
				...(config.password ? { password: config.password } : {}),
				...(config.publicUrlBase ? { publicUrlBase: config.publicUrlBase } : {}),
			};
			_storage = await createWebdavStorage(wdCfg as never);
			break;
		}
		case "sql": {
			const { createSqlStorage } = await import("./drivers/sql");
			_storage = await createSqlStorage({
				connectionString: config.connectionString ?? "",
				...(config.tableName ? { tableName: config.tableName } : {}),
				...(config.publicUrlBase ? { publicUrlBase: config.publicUrlBase } : {}),
			} as never);
			break;
		}
		case "http": {
			const { createHttpStorage } = await import("./drivers/http");
			_storage = await createHttpStorage({
				baseUrl: config.endpoint ?? "",
				...(config.publicUrlBase ? { publicUrlBase: config.publicUrlBase } : {}),
			} as never);
			break;
		}
		case "memory": {
			const { createMemoryStorage } = await import("./drivers/memory");
			_storage = createMemoryStorage();
			break;
		}
		default: {
			const _exhaustive: never = config.type;
			throw new Error(`Unsupported storage type: ${String(_exhaustive)}`);
		}
	}

	return _storage;
}
