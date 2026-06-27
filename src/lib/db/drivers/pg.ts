import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { cockroachTable } from "drizzle-orm/cockroach-core";
import { text as cockroachText, timestamp as cockroachTimestamp } from "drizzle-orm/cockroach-core";
import { int4 as cockroachInt } from "drizzle-orm/cockroach-core";
import { createSchema } from "../schema";
import type { DatabaseType } from "../config";

export const schema = createSchema({
	table: pgTable,
	id: serial,
	text,
	timestamp,
});

const cockroachId = (name: string) => cockroachInt(name).generatedAlwaysAsIdentity();
export const cockroachSchema = createSchema({
	table: cockroachTable,
	id: cockroachId,
	text: cockroachText,
	timestamp: cockroachTimestamp,
});

async function d(path: string, ...args: any[]) {
	const mod: any = await import(path);
	return mod.drizzle(...args);
}

const drivers: Record<string, (url?: string) => Promise<any>> = {
	"postgres-js": async (url?: string) => {
		const { default: postgres } = await import("postgres");
		return d("drizzle-orm/postgres-js", postgres(url!), { schema });
	},
	"node-postgres": async (url?: string) => {
		const { Pool } = await import("pg");
		const pool = new Pool({ connectionString: url! });
		return d("drizzle-orm/node-postgres", pool, { schema });
	},
	"neon-http": async (url?: string) => {
		return d("drizzle-orm/neon-http", url!, { schema });
	},
	"neon-serverless": async (url?: string) => {
		const { neon } = await import("@neondatabase/serverless");
		const sql = neon(url!);
		return d("drizzle-orm/neon-serverless", sql, { schema });
	},
	"vercel-postgres": async () => {
		return d("drizzle-orm/vercel-postgres", { schema });
	},
	pglite: async (url?: string) => {
		const { PGlite } = await import("@electric-sql/pglite");
		const client = new PGlite(url || undefined);
		return d("drizzle-orm/pglite", client, { schema });
	},
	xata: async () => {
		return d("drizzle-orm/xata-http", { schema });
	},
	supabase: async (url?: string) => {
		const { default: postgres } = await import("postgres");
		return d("drizzle-orm/postgres-js", postgres(url!), { schema });
	},
	cockroachdb: async (url?: string) => {
		const { Pool } = await import("pg");
		const pool = new Pool({ connectionString: url! });
		return d("drizzle-orm/node-postgres", pool, { schema });
	},
	cockroach: async (url?: string) => {
		return d("drizzle-orm/cockroach", { connection: url!, schema: cockroachSchema });
	},
	"aws-data-api-pg": async (url?: string) => {
		const { RDSDataClient } = await import("@aws-sdk/client-rds-data");
		const region = process.env.AWS_REGION || undefined;
		const client = new RDSDataClient({ region } as any);
		const database = url ? new URL(url).pathname?.replace("/", "") || "postgres" : "postgres";
		return d("drizzle-orm/aws-data-api/pg", client, {
			database,
			secretArn: process.env.AWS_SECRET_ARN!,
			resourceArn: process.env.AWS_RESOURCE_ARN!,
			schema,
		});
	},
	"bun-sql": async (url?: string) => {
		const { SQL } = await import("bun");
		const sql = new SQL(url!);
		return d("drizzle-orm/bun-sql", sql, { schema });
	},
	"pg-proxy": async () => {
		const { default: postgres } = await import("postgres");
		const sql = postgres(process.env.DATABASE_URL!);
		const callback = async (query: string, params: any[]) => {
			const result = await sql.unsafe(query, params);
			return { rows: result };
		};
		return d("drizzle-orm/pg-proxy", callback, { schema });
	},
	"effect-postgres": async (url?: string) => {
		const mod: any = await import("drizzle-orm/effect-postgres");
		const { PgClient } = await import("@effect/sql-pg");
		const { Effect } = await import("effect");
		const layer = PgClient.layer({ url: url! });
		return mod.make({ schema }).pipe(Effect.provide(layer));
	},
	"netlify-db": async () => {
		return d("drizzle-orm/netlify-db", { schema });
	},
};

export async function createClient(type: DatabaseType, url?: string) {
	const driver = drivers[type];
	if (!driver) {
		throw new Error(`Unsupported PostgreSQL/CockroachDB driver: ${type}`);
	}
	return driver(url);
}
