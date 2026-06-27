import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createSchema } from "../schema";

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
	text: (name: string) => text(name),
	timestamp: tsBuilder,
});

export async function createClient(filePath: string) {
	const duckdb = await import("duckdb/async");
	const db = await duckdb.Database.create(filePath || ":memory:");

	return {
		async raw(query: string, ...params: unknown[]) {
			const conn = await db.connect();
			try {
				const rows = await conn.all(query, ...params);
				return rows;
			} finally {
				await conn.close();
			}
		},

		async exec(query: string) {
			const conn = await db.connect();
			try {
				await conn.exec(query);
			} finally {
				await conn.close();
			}
		},

		async close() {
			await db.close();
		},

		$client: db,
	};
}
