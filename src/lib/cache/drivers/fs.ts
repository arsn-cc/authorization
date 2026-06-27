import { mkdir, readFile, unlink, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { Cache } from "../types";

function safeKey(key: string): string {
	return Buffer.from(key, "utf-8").toString("hex");
}

export async function createFsCache(dirPath: string): Promise<Cache> {
	const dir = dirPath;
	if (!existsSync(dir)) {
		await mkdir(dir, { recursive: true });
	}

	return {
		async get<T>(key: string): Promise<T | null> {
			const filePath = join(dir, safeKey(key));
			try {
				const raw = await readFile(filePath, "utf-8");
				const entry = JSON.parse(raw) as { value: T; expiresAt: number | null };
				if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
					await unlink(filePath).catch(() => {});
					return null;
				}
				return entry.value;
			} catch {
				return null;
			}
		},

		async set(key: string, value: unknown, ttl?: number): Promise<void> {
			const filePath = join(dir, safeKey(key));
			const entry = {
				value,
				expiresAt: ttl !== undefined && ttl > 0 ? Date.now() + ttl * 1000 : null,
			};
			await writeFile(filePath, JSON.stringify(entry), "utf-8");
		},

		async delete(key: string): Promise<void> {
			const filePath = join(dir, safeKey(key));
			await unlink(filePath).catch(() => {});
		},

		async clear(): Promise<void> {
			await rm(dir, { recursive: true, force: true });
			await mkdir(dir, { recursive: true });
		},

		async has(key: string): Promise<boolean> {
			const filePath = join(dir, safeKey(key));
			try {
				const raw = await readFile(filePath, "utf-8");
				const entry = JSON.parse(raw) as { expiresAt: number | null };
				if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
					await unlink(filePath).catch(() => {});
					return false;
				}
				return true;
			} catch {
				return false;
			}
		},
	};
}
