import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createSchema } from "../schema";
import type { DatabaseType } from "../config";

const tsBuilder = (name: string) => {
	const col = text(name);
	return {
		notNull: () => col.notNull(),
		defaultNow: () => col.default(sql`(CURRENT_TIMESTAMP)`),
	};
};

export const schema = createSchema({
	table: sqliteTable,
	id: (name: string) => integer(name),
	integer: (name: string) => integer(name),
	text: (name: string) => text(name),
	timestamp: tsBuilder,
});

async function d(path: string, ...args: any[]) {
	const mod: any = await import(path);
	return mod.drizzle(...args);
}

const drivers: Record<string, (url?: string, filePath?: string) => Promise<any>> = {
	libsql: async (url?: string) => {
		const { createClient } = await import("@libsql/client");
		const client = createClient({ url: url || "file:./data.db" });
		return d("drizzle-orm/libsql", client, { schema });
	},
	"better-sqlite3": async (_url?: string, filePath?: string) => {
		const modDb: any = await import("better-sqlite3");
		const Database = modDb.default || modDb;
		const client = new Database(filePath || "./data.db");
		return d("drizzle-orm/better-sqlite3", client, { schema });
	},
	"node-sqlite": async (_url?: string, filePath?: string) => {
		const { DatabaseSync } = await import("node:sqlite");
		const client = new DatabaseSync(filePath || "./data.db");
		return d("drizzle-orm/node-sqlite", client, { schema });
	},
	"bun-sqlite": async (_url?: string, filePath?: string) => {
		const { Database } = await import("bun:sqlite");
		const client = new Database(filePath || "./data.db");
		return d("drizzle-orm/bun-sqlite", client, { schema });
	},
	d1: async () => {
		if (!process.env.D1_BINDING) {
			throw new Error("D1_BINDING env var required for d1 database type");
		}
		return d("drizzle-orm/d1", process.env.D1_BINDING as any, { schema });
	},
	"expo-sqlite": async (_url?: string, filePath?: string) => {
		const { openDatabaseSync } = await import("expo-sqlite");
		const client = openDatabaseSync(filePath || "db.db");
		return d("drizzle-orm/expo-sqlite", client, { schema });
	},
	"durable-objects": async () => {
		if (!process.env.DO_SQLITE_BINDING) {
			throw new Error("DO_SQLITE_BINDING binding required for durable-objects database type");
		}
		return d("drizzle-orm/durable-sqlite", process.env.DO_SQLITE_BINDING as any, { schema });
	},
	"op-sqlite": async (_url?: string, filePath?: string) => {
		const { open } = await import("@op-engineering/op-sqlite");
		const client = open({ name: filePath || "db" });
		return d("drizzle-orm/op-sqlite", client, { schema });
	},
	"sql-js": async () => {
		const modSql: any = await import("sql.js");
		const initSqlJs = modSql.default || modSql;
		const SQL = await initSqlJs();
		const client = new SQL.Database();
		return d("drizzle-orm/sql-js", client, { schema });
	},
	"sqlite-cloud": async (url?: string) => {
		const { createClient } = await import("@libsql/client");
		const client = createClient({ url: url || "file:./data.db" });
		return d("drizzle-orm/sqlite-cloud", client, { schema });
	},
	tursodatabase: async (url?: string) => {
		return d("drizzle-orm/tursodatabase", url || "./data.db", { schema });
	},
	"sqlite-proxy": async () => {
		const modDb: any = await import("better-sqlite3");
		const Database = modDb.default || modDb;
		const client = new Database(process.env.DATABASE_FILE || "./data.db");
		const callback = async (query: string, params: any[], method: string) => {
			const stmt = client.prepare(query);
			if (method === "all") {
				const rows = stmt.all(...params);
				return { rows: rows as any[] };
			}
			const info = stmt.run(...params);
			return { rows: [] as any[], info };
		};
		return d("drizzle-orm/sqlite-proxy", callback, { schema });
	},
};

export async function createClient(type: DatabaseType, url?: string, filePath?: string) {
	const driver = drivers[type];
	if (!driver) {
		throw new Error(`Unsupported SQLite driver: ${type}`);
	}
	return driver(url, filePath);
}
