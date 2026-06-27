import { getConfig, dialectFor } from "./config";

type Db = Awaited<ReturnType<typeof initDb>>;

let _db: Db;

async function initDb() {
	const config = getConfig();
	const dialect = dialectFor(config.type);
	const url = config.url || "";
	const filePath = config.filePath;

	if (config.type === "duckdb") {
		const { createClient } = await import("./drivers/duckdb");
		return createClient(filePath ?? ":memory:");
	}

	switch (dialect) {
		case "postgresql":
		case "cockroach": {
			const { createClient } = await import("./drivers/pg");
			return createClient(config.type, url);
		}
		case "mysql": {
			const { createClient } = await import("./drivers/mysql");
			return createClient(config.type, url);
		}
		case "sqlite": {
			const { createClient } = await import("./drivers/sqlite");
			return createClient(config.type, url, filePath);
		}
		case "singlestore": {
			const { createClient } = await import("./drivers/singlestore");
			return createClient(config.type, url);
		}
		case "mssql": {
			const { createClient } = await import("./drivers/mssql");
			return createClient(config.type, url);
		}
		default: {
			const _exhaustive: never = dialect;
			throw new Error(`Unsupported dialect: ${String(_exhaustive)}`);
		}
	}
}

export async function getDb() {
	if (!_db) {
		_db = await initDb();
	}
	return _db;
}

export type { DatabaseType } from "./config";
export type { Dialect } from "./config";
