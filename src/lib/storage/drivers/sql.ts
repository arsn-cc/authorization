import type { FileStorage, FileMetadata } from "../types";

export async function createSqlStorage(config: {
	connectionString: string;
	tableName?: string;
	publicUrlBase?: string;
}): Promise<FileStorage> {
	const { default: postgres } = await import("postgres");
	const sql = postgres(config.connectionString);
	const table = config.tableName ?? "_files";

	await sql.unsafe(`
		CREATE TABLE IF NOT EXISTS "${table}" (
			key TEXT PRIMARY KEY,
			data BYTEA NOT NULL,
			content_type TEXT,
			size BIGINT NOT NULL
		)
	`);

	return {
		async write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void> {
			const buf = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;
			const size = typeof buf === "string" ? Buffer.byteLength(buf) : buf.byteLength;
			const sqlData = typeof buf === "string" ? Buffer.from(buf) : Buffer.from(buf);
			await sql`
				INSERT INTO ${sql(table)} (key, data, content_type, size)
				VALUES (${key}, ${sqlData}::bytea, ${options?.contentType ?? null}, ${size})
				ON CONFLICT (key) DO UPDATE SET data = ${sqlData}::bytea, content_type = ${options?.contentType ?? null}, size = ${size}
			`;
		},

		async read(key: string): Promise<Uint8Array | null> {
			const rows = await sql<{ data: Buffer }[]>`
				SELECT data FROM ${sql(table)} WHERE key = ${key}
			`;
			const row = rows[0];
			if (!row) {
				return null;
			}
			return new Uint8Array(row.data);
		},

		async delete(key: string): Promise<void> {
			await sql`DELETE FROM ${sql(table)} WHERE key = ${key}`;
		},

		async list(prefix?: string): Promise<string[]> {
			if (prefix) {
				const rows = await sql<{ key: string }[]>`
					SELECT key FROM ${sql(table)} WHERE key LIKE ${`${prefix}%`}
				`;
				return rows.map((r) => r.key);
			}
			const rows = await sql<{ key: string }[]>`SELECT key FROM ${sql(table)}`;
			return rows.map((r) => r.key);
		},

		async exists(key: string): Promise<boolean> {
			const rows = await sql<[{ count: bigint }]>`
				SELECT COUNT(*) as count FROM ${sql(table)} WHERE key = ${key}
			`;
			return Number(rows[0].count) > 0;
		},

		async metadata(key: string): Promise<FileMetadata | null> {
			const rows = await sql<{ size: bigint; content_type: string | null }[]>`
				SELECT size, content_type FROM ${sql(table)} WHERE key = ${key}
			`;
			const row = rows[0];
			if (!row) {
				return null;
			}
			return {
				size: Number(row.size),
				contentType: row.content_type ?? undefined,
			};
		},

		url(key: string): string | undefined {
			return config.publicUrlBase ? `${config.publicUrlBase.replace(/\/$/, "")}/${key}` : undefined;
		},

		async clear(): Promise<void> {
			await sql`DELETE FROM ${sql(table)}`;
		},
	};
}
