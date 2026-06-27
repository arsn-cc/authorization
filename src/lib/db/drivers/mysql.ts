import { mysqlTable, serial, int, text, timestamp } from "drizzle-orm/mysql-core";
import { createSchema } from "../schema";
import type { DatabaseType } from "../config";

export const schema = createSchema({
	table: mysqlTable,
	id: serial,
	integer: int,
	text,
	timestamp,
});

async function d(path: string, ...args: any[]) {
	const mod: any = await import(path);
	return mod.drizzle(...args);
}

const drivers: Record<string, (url?: string) => Promise<any>> = {
	mysql2: async (url?: string) => {
		const { default: mysql } = await import("mysql2/promise");
		const connection = await mysql.createConnection(url!);
		return d("drizzle-orm/mysql2", connection, { schema, mode: "default" });
	},
	planetscale: async (url?: string) => {
		const { connect } = await import("@planetscale/database");
		const connection = connect({ url: url! });
		return d("drizzle-orm/planetscale-serverless", connection, { schema });
	},
	tidb: async (url?: string) => {
		const { default: mysql } = await import("mysql2/promise");
		const connection = await mysql.createConnection(url!);
		return d("drizzle-orm/mysql2", connection, { schema, mode: "default" });
	},
	"tidb-serverless": async (url?: string) => {
		const { connect } = await import("@tidbcloud/serverless");
		const connection = connect({ url: url! });
		return d("drizzle-orm/tidb-serverless", connection, { schema });
	},
	"mysql-proxy": async () => {
		const { default: mysql } = await import("mysql2/promise");
		const connection = await mysql.createConnection(process.env.DATABASE_URL!);
		const callback = async (query: string, params: any[]) => {
			const [rows] = await connection.execute(query, params);
			return { rows: rows as any[] };
		};
		return d("drizzle-orm/mysql-proxy", callback, { schema });
	},
};

export async function createClient(type: DatabaseType, url?: string) {
	const driver = drivers[type];
	if (!driver) {
		throw new Error(`Unsupported MySQL driver: ${type}`);
	}
	return driver(url);
}
