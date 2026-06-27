import type { FileStorage, FileMetadata } from "../types";

export interface R2Binding {
	put(
		key: string,
		value: ReadableStream | Uint8Array | string,
		options?: {
			httpMetadata?: { contentType?: string };
			customMetadata?: Record<string, string>;
		},
	): Promise<void>;
	get(key: string): Promise<{
		body: ReadableStream | null;
		bodyUsed: boolean;
		arrayBuffer(): Promise<ArrayBuffer>;
		text(): Promise<string>;
		json(): Promise<unknown>;
		writeHttpMetadata(headers: Headers): void;
		httpMetadata?: { contentType?: string };
		size?: number;
	} | null>;
	delete(key: string): Promise<void>;
	list(options?: { prefix?: string; limit?: number }): Promise<{
		objects: { key: string; size: number; uploaded: Date }[];
		truncated: boolean;
		cursor?: string;
	}>;
}

export function createR2Storage(binding: R2Binding, publicUrlBase?: string): FileStorage {
	return {
		async write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void> {
			const body = data instanceof Blob ? data.stream() : data;
			if (options?.contentType) {
				await binding.put(key, body, { httpMetadata: { contentType: options.contentType } });
			} else {
				await binding.put(key, body);
			}
		},

		async read(key: string): Promise<Uint8Array | null> {
			const obj = await binding.get(key);
			if (!obj) {
				return null;
			}
			return new Uint8Array(await obj.arrayBuffer());
		},

		async delete(key: string): Promise<void> {
			await binding.delete(key);
		},

		async list(prefix?: string): Promise<string[]> {
			const result = await binding.list(prefix ? { prefix } : {});
			return result.objects.map((o) => o.key);
		},

		async exists(key: string): Promise<boolean> {
			const obj = await binding.get(key);
			return obj !== null;
		},

		async metadata(key: string): Promise<FileMetadata | null> {
			const obj = await binding.get(key);
			if (!obj) {
				return null;
			}
			return {
				size: obj.size ?? 0,
				contentType: obj.httpMetadata?.contentType,
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
