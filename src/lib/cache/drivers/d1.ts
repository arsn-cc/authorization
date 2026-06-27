import type { Cache } from "../types";

export interface D1Binding {
	prepare(sql: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
	bind(...params: unknown[]): D1PreparedStatement;
	all(): Promise<{ results: Record<string, unknown>[] }>;
	run(): Promise<{ meta: { changes: number } }>;
}

export function createD1Cache(binding: D1Binding, defaultTtl: number): Cache {
	const db = binding;

	void db
		.prepare(
			`CREATE TABLE IF NOT EXISTS _cache (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL,
			expires_at INTEGER
		)`,
		)
		.run();

	return {
		async get<T>(key: string): Promise<T | null> {
			const { results } = (await db
				.prepare("SELECT value, expires_at FROM _cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)")
				.bind(key, Date.now())
				.all()) as { results: { value: string; expires_at: number | null }[] };
			const row = results[0];
			if (!row) {
				return null;
			}
			try {
				return JSON.parse(row.value) as T;
			} catch {
				return row.value as unknown as T;
			}
		},

		async set(key: string, value: unknown, ttl?: number): Promise<void> {
			const serialized = typeof value === "string" ? value : JSON.stringify(value);
			const expiresAt = (ttl ?? defaultTtl) > 0 ? Date.now() + (ttl ?? defaultTtl) * 1000 : null;
			await db
				.prepare("INSERT OR REPLACE INTO _cache (key, value, expires_at) VALUES (?, ?, ?)")
				.bind(key, serialized, expiresAt)
				.run();
		},

		async delete(key: string): Promise<void> {
			await db.prepare("DELETE FROM _cache WHERE key = ?").bind(key).run();
		},

		async clear(): Promise<void> {
			await db.prepare("DELETE FROM _cache").run();
		},

		async has(key: string): Promise<boolean> {
			const { results } = await db
				.prepare("SELECT 1 FROM _cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)")
				.bind(key, Date.now())
				.all();
			return results.length > 0;
		},
	};
}
