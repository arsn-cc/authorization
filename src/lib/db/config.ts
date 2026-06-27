export type DatabaseType =
	| "postgres-js"
	| "node-postgres"
	| "neon-http"
	| "neon-serverless"
	| "vercel-postgres"
	| "pglite"
	| "xata"
	| "supabase"
	| "cockroachdb"
	| "cockroach"
	| "aws-data-api-pg"
	| "bun-sql"
	| "pg-proxy"
	| "effect-postgres"
	| "netlify-db"
	| "mysql2"
	| "planetscale"
	| "tidb"
	| "tidb-serverless"
	| "mysql-proxy"
	| "libsql"
	| "better-sqlite3"
	| "node-sqlite"
	| "bun-sqlite"
	| "d1"
	| "expo-sqlite"
	| "durable-objects"
	| "op-sqlite"
	| "sql-js"
	| "sqlite-proxy"
	| "sqlite-cloud"
	| "tursodatabase"
	| "singlestore"
	| "singlestore-proxy"
	| "mssql"
	| "node-mssql"
	| "duckdb";

export type Dialect = "postgresql" | "mysql" | "sqlite" | "singlestore" | "mssql" | "cockroach";

export interface DbConfig {
	type: DatabaseType;
	url: string | undefined;
	filePath: string | undefined;
}

const ALIASES: Record<string, DatabaseType> = {
	postgres: "postgres-js",
};

export function getConfig(): DbConfig {
	const raw = process.env.DATABASE_TYPE || "postgres-js";
	const type = (ALIASES[raw] ?? raw) as DatabaseType;
	return {
		type,
		url: process.env.DATABASE_URL,
		filePath: process.env.DATABASE_FILE,
	};
}

export function dialectFor(type: DatabaseType): Dialect {
	if (
		type === "postgres-js" ||
		type === "node-postgres" ||
		type === "neon-http" ||
		type === "neon-serverless" ||
		type === "vercel-postgres" ||
		type === "pglite" ||
		type === "xata" ||
		type === "supabase" ||
		type === "aws-data-api-pg" ||
		type === "bun-sql" ||
		type === "pg-proxy" ||
		type === "effect-postgres" ||
		type === "netlify-db"
	) {
		return "postgresql";
	}
	if (type === "cockroachdb" || type === "cockroach") {
		return "cockroach";
	}
	if (
		type === "mysql2" ||
		type === "planetscale" ||
		type === "tidb" ||
		type === "tidb-serverless" ||
		type === "mysql-proxy"
	) {
		return "mysql";
	}
	if (
		type === "libsql" ||
		type === "better-sqlite3" ||
		type === "node-sqlite" ||
		type === "bun-sqlite" ||
		type === "d1" ||
		type === "expo-sqlite" ||
		type === "durable-objects" ||
		type === "op-sqlite" ||
		type === "sql-js" ||
		type === "sqlite-proxy" ||
		type === "sqlite-cloud" ||
		type === "tursodatabase" ||
		type === "duckdb"
	) {
		return "sqlite";
	}
	if (type === "singlestore" || type === "singlestore-proxy") {
		return "singlestore";
	}
	if (type === "mssql" || type === "node-mssql") {
		return "mssql";
	}

	const _exhaustive: never = type;
	return _exhaustive;
}
