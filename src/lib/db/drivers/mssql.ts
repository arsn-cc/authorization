import { mssqlTable, int, nvarchar, datetime } from "drizzle-orm/mssql-core";

export const schema = {
	user: mssqlTable("user", {
		id: int("id").primaryKey().notNull(),
		name: nvarchar("name", { length: 255 }),
		email: nvarchar("email", { length: 255 }).notNull().unique(),
		emailVerified: datetime("email_verified", { mode: "string" }),
		passwordHash: nvarchar("password_hash", { length: 255 }),
		image: nvarchar("image", { length: 500 }),
		roleId: int("role_id"),
		createdAt: datetime("created_at", { mode: "string" }).notNull().defaultGetDate(),
		updatedAt: datetime("updated_at", { mode: "string" }).notNull().defaultGetDate(),
	}),
	session: mssqlTable("session", {
		id: int("id").primaryKey().notNull(),
		userId: int("user_id").notNull(),
		token: nvarchar("token", { length: 512 }).notNull().unique(),
		expires: datetime("expires", { mode: "string" }).notNull(),
		usedAt: datetime("used_at", { mode: "string" }),
		userAgent: nvarchar("user_agent", { length: 500 }),
		ip: nvarchar("ip", { length: 45 }),
		location: nvarchar("location", { length: 255 }),
		city: nvarchar("city", { length: 100 }),
		country: nvarchar("country", { length: 100 }),
		region: nvarchar("region", { length: 100 }),
		timezone: nvarchar("timezone", { length: 50 }),
		language: nvarchar("language", { length: 50 }),
		deviceType: nvarchar("device_type", { length: 20 }),
		os: nvarchar("os", { length: 50 }),
		browser: nvarchar("browser", { length: 100 }),
		createdAt: datetime("created_at", { mode: "string" }).notNull().defaultGetDate(),
	}),
	client: mssqlTable("client", {
		id: int("id").primaryKey().notNull(),
		clientId: nvarchar("client_id", { length: 255 }).notNull().unique(),
		type: nvarchar("type", { length: 20 }).notNull(),
		clientSecret: nvarchar("client_secret", { length: 255 }),
		name: nvarchar("name", { length: 255 }).notNull(),
		redirectUris: nvarchar("redirect_uris", { length: 2000 }),
		grants: nvarchar("grants", { length: 500 }),
		scopes: nvarchar("scopes", { length: 500 }).notNull().default("openid profile email"),
		logo: nvarchar("logo", { length: 500 }),
		website: nvarchar("website", { length: 500 }),
		requireConsent: int("require_consent").notNull().default(1),
		entityId: nvarchar("entity_id", { length: 500 }),
		acsUrl: nvarchar("acs_url", { length: 500 }),
		audience: nvarchar("audience", { length: 500 }),
		samlCertificate: nvarchar("saml_certificate", { length: 2000 }),
		samlBinding: nvarchar("saml_binding", { length: 50 }),
		nameIdFormat: nvarchar("name_id_format", { length: 200 }),
		assertionSigned: int("assertion_signed"),
		authnSigned: int("authn_signed"),
		createdAt: datetime("created_at", { mode: "string" }).notNull().defaultGetDate(),
		updatedAt: datetime("updated_at", { mode: "string" }).notNull().defaultGetDate(),
	}),
	role: mssqlTable("role", {
		id: int("id").primaryKey().notNull(),
		name: nvarchar("name", { length: 100 }).notNull().unique(),
		description: nvarchar("description", { length: 500 }),
		permissions: nvarchar("permissions", { length: 2000 }).notNull().default("[]"),
	}),
	permission: mssqlTable("permission", {
		id: int("id").primaryKey().notNull(),
		name: nvarchar("name", { length: 100 }).notNull().unique(),
		description: nvarchar("description", { length: 500 }),
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
