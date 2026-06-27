import { mssqlTable, int, nvarchar, datetime } from "drizzle-orm/mssql-core";

export const schema = {
	users: mssqlTable("users", {
		id: int("id").primaryKey().notNull(),
		name: nvarchar("name", { length: 255 }).notNull(),
		email: nvarchar("email", { length: 255 }).notNull().unique(),
		createdAt: datetime("created_at", { mode: "string" }).notNull().defaultGetDate(),
	}),
};

async function d(path: string, ...args: any[]) {
	const mod: any = await import(path);
	return mod.drizzle(...args);
}

const drivers: Record<string, (url?: string) => Promise<any>> = {
	mssql: async (url?: string) => {
		return d("drizzle-orm/node-mssql", url!, { schema });
	},
	"node-mssql": async (url?: string) => {
		return d("drizzle-orm/node-mssql", url!, { schema });
	},
};

export async function createClient(type: string, url?: string) {
	const driver = drivers[type];
	if (!driver) {
		throw new Error(`Unsupported MSSQL driver: ${type}`);
	}
	return driver(url);
}
