import type { Cache } from "../types";

function q(table: string, sql: string): string {
	return sql.replace(/:table/g, table);
}

export async function createPgCache(connectionString: string, tableName: string, _defaultTtl: number): Promise<Cache> {
	const { default: postgres } = await import("postgres");
	const sql = postgres(connectionString);
	const table = tableName;

	await sql.unsafe(
		q(
			table,
			`CREATE TABLE IF NOT EXISTS ":table" (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL,
		expires_at TIMESTAMPTZ
	)`,
		),
	);

	return {
		async get<T>(key: string): Promise<T | null> {
			const rows = await sql.unsafe<{ value: string }[]>(
				q(table, `SELECT value FROM ":table" WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW())`),
				[key],
			);
			const row = rows[0];
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
			if (ttl !== undefined && ttl > 0) {
				await sql.unsafe(
					q(
						table,
						`INSERT INTO ":table" (key, value, expires_at) VALUES ($1, $2, NOW() + make_interval(secs => $3))
					 ON CONFLICT (key) DO UPDATE SET value = $2, expires_at = NOW() + make_interval(secs => $3)`,
					),
					[key, serialized, ttl],
				);
			} else {
				await sql.unsafe(
					q(
						table,
						`INSERT INTO ":table" (key, value, expires_at) VALUES ($1, $2, NULL)
					 ON CONFLICT (key) DO UPDATE SET value = $2, expires_at = NULL`,
					),
					[key, serialized],
				);
			}
		},

		async delete(key: string): Promise<void> {
			await sql.unsafe(q(table, `DELETE FROM ":table" WHERE key = $1`), [key]);
		},

		async clear(): Promise<void> {
			await sql.unsafe(q(table, `DELETE FROM ":table"`));
		},

		async has(key: string): Promise<boolean> {
			const rows = await sql.unsafe<{ count: number }[]>(
				q(
					table,
					`SELECT COUNT(*) as count FROM ":table" WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
				),
				[key],
			);
			return rows.length > 0 && Number(rows[0]?.count) > 0;
		},
	};
}
