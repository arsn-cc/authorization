import type { Cache } from "../types";

function isExpired(row: { expires_at: number | null }): boolean {
	return row.expires_at !== null && row.expires_at <= Date.now();
}

export async function createSqliteCache(filePath: string, defaultTtl: number): Promise<Cache> {
	const modDb: any = await import("better-sqlite3");
	const Database = modDb.default || modDb;
	const db = new Database(filePath);

	db.exec(
		`CREATE TABLE IF NOT EXISTS cache (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL,
			expires_at INTEGER
		)`,
	);

	const stmt = {
		get: db.prepare("SELECT value, expires_at FROM cache WHERE key = ?"),
		set: db.prepare("INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)"),
		delete: db.prepare("DELETE FROM cache WHERE key = ?"),
		clear: db.prepare("DELETE FROM cache"),
		has: db.prepare("SELECT 1 FROM cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)"),
		cleanup: db.prepare("DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at <= ?"),
	};

	return {
		async get<T>(key: string): Promise<T | null> {
			const row = stmt.get.get(key) as { value: string; expires_at: number | null } | undefined;
			if (!row) {
				return null;
			}
			if (isExpired(row)) {
				stmt.cleanup.run(Date.now());
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
			stmt.set.run(key, serialized, expiresAt);
		},

		async delete(key: string): Promise<void> {
			stmt.delete.run(key);
		},

		async clear(): Promise<void> {
			stmt.clear.run();
		},

		async has(key: string): Promise<boolean> {
			const row = stmt.has.get(key, Date.now());
			return row !== undefined;
		},
	};
}
