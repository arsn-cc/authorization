import type { FileStorage, FileMetadata } from "../types";

export async function createWebdavStorage(config: {
	url: string;
	username?: string;
	password?: string;
	publicUrlBase?: string;
}): Promise<FileStorage> {
	const { createClient } = await import("webdav");
	const client = createClient(config.url, {
		...(config.username ? { username: config.username } : {}),
		...(config.password ? { password: config.password } : {}),
	} as never) as {
		putFileContents(
			path: string,
			data: string | Uint8Array,
			options?: {
				contentType?: string;
				overwrite?: boolean;
			},
		): Promise<void>;
		getFileContents(path: string, options?: { format: string }): Promise<ArrayBuffer>;
		deleteFile(path: string): Promise<void>;
		getDirectoryContents(
			path: string,
			options?: {
				deep?: boolean;
			},
		): Promise<{ filename: string; type: string; size?: number; mime?: string }[]>;
		exists(path: string): Promise<boolean>;
		stat(path: string): Promise<{ size?: number; mime?: string }>;
	};

	return {
		async write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void> {
			const buf = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;
			await client.putFileContents(key, buf, {
				...(options?.contentType ? { contentType: options.contentType } : {}),
				overwrite: true,
			});
		},

		async read(key: string): Promise<Uint8Array | null> {
			try {
				const buf = await client.getFileContents(key, { format: "binary" });
				return new Uint8Array(buf);
			} catch {
				return null;
			}
		},

		async delete(key: string): Promise<void> {
			await client.deleteFile(key).catch(() => {});
		},

		async list(prefix?: string): Promise<string[]> {
			try {
				const items = await client.getDirectoryContents(prefix ?? "/", { deep: true });
				return items.filter((i) => i.type === "file").map((i) => i.filename);
			} catch {
				return [];
			}
		},

		async exists(key: string): Promise<boolean> {
			try {
				return await client.exists(key);
			} catch {
				return false;
			}
		},

		async metadata(key: string): Promise<FileMetadata | null> {
			try {
				const s = await client.stat(key);
				return {
					size: s.size ?? 0,
					contentType: s.mime,
				};
			} catch {
				return null;
			}
		},

		url(key: string): string | undefined {
			if (config.publicUrlBase) {
				return `${config.publicUrlBase.replace(/\/$/, "")}/${key}`;
			}
			return `${config.url.replace(/\/$/, "")}/${key}`;
		},

		async clear(): Promise<void> {
			try {
				const items = await client.getDirectoryContents("/", { deep: true });
				const files = items.filter((i) => i.type === "file");
				await Promise.all(files.map((f) => client.deleteFile(f.filename)));
			} catch {
				// ignore
			}
		},
	};
}
