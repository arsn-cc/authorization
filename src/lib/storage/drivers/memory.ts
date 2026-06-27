import type { FileStorage, FileMetadata } from "../types";

interface MemEntry {
	data: Uint8Array;
	contentType: string | undefined;
}

export function createMemoryStorage(): FileStorage {
	const store = new Map<string, MemEntry>();

	return {
		async write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void> {
			const buf =
				data instanceof Blob
					? new Uint8Array(await data.arrayBuffer())
					: typeof data === "string"
						? new TextEncoder().encode(data)
						: data;
			store.set(key, { data: buf, contentType: options?.contentType });
		},

		async read(key: string): Promise<Uint8Array | null> {
			const entry = store.get(key);
			return entry?.data ?? null;
		},

		async delete(key: string): Promise<void> {
			store.delete(key);
		},

		async list(prefix?: string): Promise<string[]> {
			const keys = Array.from(store.keys());
			return prefix ? keys.filter((k) => k.startsWith(prefix)) : keys;
		},

		async exists(key: string): Promise<boolean> {
			return store.has(key);
		},

		async metadata(key: string): Promise<FileMetadata | null> {
			const entry = store.get(key);
			if (!entry) {
				return null;
			}
			return { size: entry.data.byteLength, contentType: entry.contentType };
		},

		url(_key: string): string | undefined {
			return undefined;
		},

		async clear(): Promise<void> {
			store.clear();
		},
	};
}
