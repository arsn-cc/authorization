declare module "ioredis" {
	interface Redis {
		get(key: string): Promise<string | null>;
		set(key: string, value: string): Promise<"OK">;
		setex(key: string, seconds: number, value: string): Promise<"OK">;
		del(...keys: string[]): Promise<number>;
		exists(...keys: string[]): Promise<number>;
		flushdb(): Promise<"OK">;
	}
	const Redis: new (url: string) => Redis;
	export default Redis;
}

declare module "memcached" {
	class Memcached {
		constructor(location: string);
		get(key: string, cb: (err: unknown, data: string | null) => void): void;
		set(key: string, value: string, lifetime: number, cb: (err: unknown) => void): void;
		del(key: string, cb: (err: unknown) => void): void;
		flush(cb: (err: unknown) => void): void;
	}
	export default Memcached;
}

declare module "@upstash/redis/cloudflare" {
	class Redis {
		constructor(config: { url: string; token: string });
		get<T>(key: string): Promise<T | null>;
		set(key: string, value: string): Promise<unknown>;
		setex(key: string, seconds: number, value: string): Promise<unknown>;
		del(key: string): Promise<number>;
		exists(...keys: string[]): Promise<number>;
		flushall(): Promise<unknown>;
	}
	export { Redis };
}

declare module "@vercel/kv" {
	interface KvNamespace {
		get<T>(key: string): Promise<T | null>;
		set(key: string, value: string): Promise<unknown>;
		setex(key: string, seconds: number, value: string): Promise<unknown>;
		del(key: string): Promise<number>;
		exists(...keys: string[]): Promise<number>;
		flushall(): Promise<unknown>;
	}
	export const kv: KvNamespace;
}

declare module "lru-cache" {
	class LRUCache<K, V> {
		constructor(options: { max: number });
		get(key: K): V | undefined;
		set(key: K, value: V): void;
		delete(key: K): void;
		clear(): void;
		has(key: K): boolean;
	}
	export { LRUCache };
}

declare module "better-sqlite3" {
	class Database {
		constructor(path: string);
		exec(sql: string): void;
		prepare(sql: string): {
			get(...params: unknown[]): unknown;
			run(...params: unknown[]): { changes: number };
			all(...params: unknown[]): unknown[];
		};
	}
	export default Database;
}

declare module "@aws-sdk/lib-dynamodb" {
	export class DynamoDBDocumentClient {
		static from(client: unknown): DynamoDBDocumentClient;
		send(command: unknown): Promise<unknown>;
	}
	export class GetCommand {
		constructor(input: { TableName: string; Key: Record<string, unknown>; ProjectionExpression?: string });
	}
	export class PutCommand {
		constructor(input: { TableName: string; Item: Record<string, unknown> });
	}
	export class DeleteCommand {
		constructor(input: { TableName: string; Key: Record<string, unknown> });
	}
	export class ScanCommand {
		constructor(input: {
			TableName: string;
			ProjectionExpression?: string;
			ExclusiveStartKey?: Record<string, unknown>;
		});
	}
}

declare module "@aws-sdk/client-dynamodb" {
	export class DynamoDBClient {
		constructor(config: Record<string, unknown>);
	}
}

declare module "etcd3" {
	export class Etcd3 {
		constructor(config: { hosts: string[] });
		get(key: string): Promise<string | null>;
		put(key: string): { value(v: string): { lease(l: unknown): { exec(): Promise<void> }; exec(): Promise<void> } };
		delete(): {
			key(k: string): { exec(): Promise<void> };
			prefix(p: string): { exec(): Promise<void> };
			all(): { exec(): Promise<void> };
		};
		lease: { grant(ttl: number): Promise<unknown> };
	}
}

declare module "firebase-admin/app" {
	export function initializeApp(config: { databaseURL: string; credential?: unknown }): unknown;
	export function cert(serviceAccount: Record<string, unknown>): unknown;
}

declare module "firebase-admin/database" {
	export function getDatabase(app?: unknown): unknown;
	export function ref(db: unknown, path: string): unknown;
	export function get(ref: unknown): Promise<{ exists(): boolean; val(): unknown }>;
	export function set(ref: unknown, value: unknown): Promise<void>;
	export function remove(ref: unknown): Promise<void>;
	export function query(ref: unknown, ...filters: unknown[]): unknown;
	export function orderByKey(): unknown;
	export function startAt(value: string): unknown;
	export function endAt(value: string): unknown;
}

declare module "duckdb/async" {
	export namespace Database {
		function create(path: string): Promise<{
			connect(): Promise<Connection>;
			close(): Promise<void>;
		}>;
	}
	interface Connection {
		all(query: string, ...params: unknown[]): Promise<unknown[]>;
		exec(query: string): Promise<void>;
		close(): Promise<void>;
	}
}
