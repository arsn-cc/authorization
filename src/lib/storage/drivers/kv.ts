import type { FileStorage, FileMetadata } from "../types";

export interface KvBinding {
	get(key: string): Promise<string | null>;
	getWithMetadata(key: string): Promise<{ value: string | null; metadata?: Record<string, string> }>;
	put(
		key: string,
		value: string | Uint8Array | ReadableStream,
		options?: {
			expirationTtl?: number;
			metadata?: Record<string, string>;
		},
	): Promise<void>;
	delete(key: string): Promise<void>;
	list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

export function createKvStorage(binding: KvBinding, publicUrlBase?: string): FileStorage {
	return {
		async write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void> {
			const meta = options?.contentType ? { contentType: options.contentType } : undefined;
			const body: Uint8Array | string = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;
			await binding.put(key, body, meta ? { metadata: meta } : undefined);
		},

		async read(key: string): Promise<Uint8Array | null> {
			const { value } = await binding.getWithMetadata(key);
			if (value === null) {
				return null;
			}
			return new TextEncoder().encode(value);
		},

		async delete(key: string): Promise<void> {
			await binding.delete(key);
		},

		async list(prefix?: string): Promise<string[]> {
			const { keys } = await binding.list(prefix ? { prefix } : {});
			return keys.map((k) => k.name);
		},

		async exists(key: string): Promise<boolean> {
			const raw = await binding.get(key);
			return raw !== null;
		},

		async metadata(key: string): Promise<FileMetadata | null> {
			const { value, metadata: meta } = await binding.getWithMetadata(key);
			if (value === null) {
				return null;
			}
			return {
				size: new TextEncoder().encode(value).byteLength,
				contentType: meta?.contentType,
			};
		},

		url(key: string): string | undefined {
			return publicUrlBase ? `${publicUrlBase.replace(/\/$/, "")}/${key}` : undefined;
		},

		async clear(): Promise<void> {
			const all = await this.list();
			await Promise.all(all.map((k) => this.delete(k)));
		},
	};
}
