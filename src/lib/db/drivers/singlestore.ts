import { singlestoreTable, serial, text, timestamp } from "drizzle-orm/singlestore-core";
import { createSchema } from "../schema";
import type { DatabaseType } from "../config";

export const schema = createSchema({
	table: singlestoreTable,
	id: serial,
	text,
	timestamp,
});

async function d(path: string, ...args: any[]) {
	const mod: any = await import(path);
	return mod.drizzle(...args);
}

const drivers: Record<string, (url?: string) => Promise<any>> = {
	singlestore: async (url?: string) => {
		const { default: mysql } = await import("mysql2/promise");
		const connection = await mysql.createConnection(url!);
		return d("drizzle-orm/singlestore", connection, { schema });
	},
	"singlestore-proxy": async () => {
		const { default: mysql } = await import("mysql2/promise");
		const connection = await mysql.createConnection(process.env.DATABASE_URL!);
		const callback = async (query: string, params: any[]) => {
			const [rows] = await connection.execute(query, params);
			return { rows: rows as any[] };
		};
		return d("drizzle-orm/singlestore-proxy", callback, { schema });
	},
};

export async function createClient(type: DatabaseType, url?: string) {
	const driver = drivers[type];
	if (!driver) {
		throw new Error(`Unsupported SingleStore driver: ${type}`);
	}
	return driver(url);
}
