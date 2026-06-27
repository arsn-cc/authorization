declare module "pg" {
	export class Pool {
		constructor(config: { connectionString: string });
		connect(): Promise<any>;
		end(): Promise<void>;
		query(text: string, params?: any[]): Promise<any>;
	}
}

declare module "@neondatabase/serverless" {
	export function neon(url: string): any;
}

declare module "@electric-sql/pglite" {
	const PGlite: new (url?: string) => any;
	export { PGlite };
}

declare module "xata" {
	const XataClient: new (config?: any) => any;
	export { XataClient };
}

declare module "@aws-sdk/client-rds-data" {
	const RDSDataClient: new (config: { region?: string }) => any;
	export { RDSDataClient };
}

declare module "@planetscale/database" {
	export function connect(config: { url: string }): any;
}

declare module "better-sqlite3" {
	const Database: new (path: string) => any;
	export = Database;
}

declare module "expo-sqlite" {
	export function openDatabaseSync(name: string): any;
}

declare module "drizzle-orm/node-sqlite" {
	export function drizzle(client: any, config?: any): any;
}

declare module "drizzle-orm/bun-sqlite" {
	export function drizzle(client: any, config?: any): any;
}

declare module "bun:sqlite" {
	class Database {
		constructor(path: string);
		prepare(sql: string): any;
	}
	export { Database };
}

declare module "bun" {
	interface SQL {
		new (url: string): any;
	}
	const SQL: SQL;
	export { SQL };
	export type SQLOptions = Record<string, any>;
}

declare module "@op-engineering/op-sqlite" {
	export function open(config: { name: string }): any;
}

declare module "sql.js" {
	interface SqlJsStatic {
		Database: new (data?: ArrayLike<number> | Buffer | null) => any;
	}
	function initSqlJs(config?: any): Promise<SqlJsStatic>;
	export = initSqlJs;
}

declare module "@tidbcloud/serverless" {
	export function connect(config: { url: string }): any;
}

declare module "drizzle-orm/effect-postgres" {
	export function make(config: { schema: any }): any;
}

declare module "@effect/sql-pg" {
	export const PgClient: any;
}

declare module "effect" {
	export const Effect: any;
}

declare module "drizzle-orm/netlify-db" {
	export function drizzle(config?: any): any;
}

declare module "@tursodatabase/database" {
	class Database {
		constructor(path: string);
	}
	export { Database };
}

declare module "drizzle-orm/tursodatabase" {
	export function drizzle(pathOrConfig: any, config?: any): any;
}

declare module "drizzle-orm/sqlite-cloud" {
	export function drizzle(client: any, config?: any): any;
}

declare module "drizzle-orm/node-mssql" {
	export function drizzle(url: string, config?: any): any;
}
