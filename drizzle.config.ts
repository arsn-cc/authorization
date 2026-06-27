import { defineConfig } from "drizzle-kit";

const raw = process.env.DATABASE_TYPE || "postgres-js";
const alias: Record<string, string> = { postgres: "postgres-js" };
const dbType = alias[raw] ?? raw;

function getDialect() {
	if (["mssql", "node-mssql"].includes(dbType)) {
		return "mssql" as const;
	}
	if (["cockroachdb", "cockroach"].includes(dbType)) {
		return "cockroach" as const;
	}
	if (["singlestore", "singlestore-proxy"].includes(dbType)) {
		return "singlestore" as const;
	}
	if (["mysql2", "planetscale", "tidb", "tidb-serverless", "mysql-proxy"].includes(dbType)) {
		return "mysql" as const;
	}
	if (dbType === "duckdb") {
		return "duckdb" as const;
	}
	if (
		[
			"libsql",
			"better-sqlite3",
			"node-sqlite",
			"bun-sqlite",
			"d1",
			"expo-sqlite",
			"durable-objects",
			"op-sqlite",
			"sql-js",
			"sqlite-proxy",
			"sqlite-cloud",
			"tursodatabase",
		].includes(dbType)
	) {
		return "sqlite" as const;
	}
	return "postgresql" as const;
}

function getCredentials() {
	const dialect = getDialect();
	const url = process.env.DATABASE_URL || (dialect === "sqlite" ? "./data.db" : "");
	return { url };
}

const dialectSchemas: Record<string, string[]> = {
	postgresql: ["./src/lib/db/drivers/pg.ts"],
	cockroach: ["./src/lib/db/drivers/pg.ts"],
	mysql: ["./src/lib/db/drivers/mysql.ts"],
	sqlite: ["./src/lib/db/drivers/sqlite.ts"],
	duckdb: ["./src/lib/db/drivers/duckdb.ts"],
	singlestore: ["./src/lib/db/drivers/singlestore.ts"],
	mssql: ["./src/lib/db/drivers/mssql.ts"],
};

export default defineConfig({
	out: "./drizzle",
	schema: dialectSchemas[getDialect()] || ["./src/lib/db/drivers/pg.ts"],
	dialect: getDialect(),
	dbCredentials: getCredentials(),
});
