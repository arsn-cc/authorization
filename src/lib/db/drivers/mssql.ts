import { mssqlTable, int, nvarchar, datetime } from "drizzle-orm/mssql-core";

export const schema = {
	user: mssqlTable("user", {
		id: int("id").primaryKey().notNull(),
		name: nvarchar("name", { length: 255 }),
		email: nvarchar("email", { length: 255 }).notNull().unique(),
		emailVerified: datetime("email_verified", { mode: "string" }),
		passwordHash: nvarchar("password_hash", { length: 255 }),
		image: nvarchar("image", { length: 500 }),
		createdAt: datetime("created_at", { mode: "string" }).notNull().defaultGetDate(),
		updatedAt: datetime("updated_at", { mode: "string" }).notNull().defaultGetDate(),
	}),
	session: mssqlTable("session", {
		id: int("id").primaryKey().notNull(),
		sessionToken: nvarchar("session_token", { length: 255 }).notNull().unique(),
		userId: int("user_id").notNull(),
		expires: datetime("expires", { mode: "string" }).notNull(),
		createdAt: datetime("created_at", { mode: "string" }).notNull().defaultGetDate(),
	}),
	client: mssqlTable("client", {
		id: int("id").primaryKey().notNull(),
		clientId: nvarchar("client_id", { length: 255 }).notNull().unique(),
		clientSecret: nvarchar("client_secret", { length: 255 }),
		name: nvarchar("name", { length: 255 }).notNull(),
		redirectUris: nvarchar("redirect_uris", { length: 2000 }).notNull().default("[]"),
		grants: nvarchar("grants", { length: 500 }).notNull().default('["authorization_code"]'),
		scopes: nvarchar("scopes", { length: 500 }).notNull().default("openid profile email"),
		logo: nvarchar("logo", { length: 500 }),
		website: nvarchar("website", { length: 500 }),
		requireConsent: int("require_consent").notNull().default(1),
		createdAt: datetime("created_at", { mode: "string" }).notNull().defaultGetDate(),
		updatedAt: datetime("updated_at", { mode: "string" }).notNull().defaultGetDate(),
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
