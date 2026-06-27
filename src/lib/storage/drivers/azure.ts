import type { FileStorage, FileMetadata } from "../types";

export async function createAzureStorage(config: {
	connectionString: string;
	containerName: string;
	publicUrlBase?: string;
}): Promise<FileStorage> {
	const { BlobServiceClient } = await import("@azure/storage-blob");
	const blobService = BlobServiceClient.fromConnectionString(config.connectionString);
	const container = blobService.getContainerClient(config.containerName);
	await container.createIfNotExists();

	return {
		async write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void> {
			const blockBlob = container.getBlockBlobClient(key);
			const buf = data instanceof Blob ? await data.arrayBuffer() : (data as ArrayBuffer | Uint8Array);
			if (options?.contentType) {
				await blockBlob.uploadData(buf, { blobHTTPHeaders: { blobContentType: options.contentType } });
			} else {
				await blockBlob.uploadData(buf);
			}
		},

		async read(key: string): Promise<Uint8Array | null> {
			try {
				const blockBlob = container.getBlockBlobClient(key);
				const response = await blockBlob.download();
				const readable = response.readableStream as unknown as AsyncIterable<Uint8Array>;
				const chunks: Uint8Array[] = [];
				for await (const chunk of readable) {
					chunks.push(chunk);
				}
				const total = chunks.reduce((a, b) => a + b.byteLength, 0);
				const result = new Uint8Array(total);
				let offset = 0;
				for (const chunk of chunks) {
					result.set(chunk, offset);
					offset += chunk.byteLength;
				}
				return result;
			} catch {
				return null;
			}
		},

		async delete(key: string): Promise<void> {
			await container.deleteBlob(key).catch(() => {});
		},

		async list(prefix?: string): Promise<string[]> {
			const keys: string[] = [];
			const iter = container.listBlobsFlat(prefix ? { prefix } : {}) as AsyncIterable<{ name: string }>;
			for await (const blob of iter) {
				keys.push(blob.name);
			}
			return keys;
		},

		async exists(key: string): Promise<boolean> {
			const blockBlob = container.getBlockBlobClient(key);
			return await blockBlob.exists();
		},

		async metadata(key: string): Promise<FileMetadata | null> {
			try {
				const blockBlob = container.getBlockBlobClient(key);
				const props = (await blockBlob.getProperties()) as { contentLength?: number; contentType?: string };
				return {
					size: props.contentLength ?? 0,
					contentType: props.contentType,
				};
			} catch {
				return null;
			}
		},

		url(key: string): string | undefined {
			if (config.publicUrlBase) {
				return `${config.publicUrlBase.replace(/\/$/, "")}/${key}`;
			}
			return container.getBlockBlobClient(key).url;
		},

		async clear(): Promise<void> {
			const iter = container.listBlobsFlat() as AsyncIterable<{ name: string }>;
			for await (const blob of iter) {
				await container.deleteBlob(blob.name);
			}
		},
	};
}
