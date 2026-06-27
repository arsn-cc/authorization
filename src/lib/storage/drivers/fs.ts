import { mkdir, readFile, writeFile, unlink, readdir, stat, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import type { FileStorage, FileMetadata } from "../types";

export async function createFsStorage(baseDir: string, publicUrlBase?: string): Promise<FileStorage> {
	const dir = baseDir;
	if (!existsSync(dir)) {
		await mkdir(dir, { recursive: true });
	}

	return {
		async write(key: string, data: Uint8Array | Blob | string, _options?: { contentType?: string }): Promise<void> {
			const filePath = join(dir, key);
			await mkdir(dirname(filePath), { recursive: true });
			const buf = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;
			await writeFile(filePath, buf);
		},

		async read(key: string): Promise<Uint8Array | null> {
			const filePath = join(dir, key);
			try {
				return await readFile(filePath);
			} catch {
				return null;
			}
		},

		async delete(key: string): Promise<void> {
			const filePath = join(dir, key);
			await unlink(filePath).catch(() => {});
		},

		async list(prefix?: string): Promise<string[]> {
			const full = prefix ? join(dir, prefix) : dir;
			try {
				const entries = await readdir(full, { recursive: true, withFileTypes: true });
				return entries.filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name).slice(dir.length + 1));
			} catch {
				return [];
			}
		},

		async exists(key: string): Promise<boolean> {
			const filePath = join(dir, key);
			return existsSync(filePath);
		},

		async metadata(key: string): Promise<FileMetadata | null> {
			const filePath = join(dir, key);
			try {
				const s = await stat(filePath);
				return { size: s.size, contentType: undefined };
			} catch {
				return null;
			}
		},

		url(key: string): string | undefined {
			return publicUrlBase ? `${publicUrlBase.replace(/\/$/, "")}/${key}` : undefined;
		},

		async clear(): Promise<void> {
			await rm(dir, { recursive: true, force: true });
			await mkdir(dir, { recursive: true });
		},
	};
}
