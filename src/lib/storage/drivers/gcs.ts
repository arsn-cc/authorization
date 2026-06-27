import type { FileStorage, FileMetadata } from "../types";

export async function createGcsStorage(config: {
	bucket: string;
	keyFilename?: string;
	publicUrlBase?: string;
}): Promise<FileStorage> {
	const { Storage } = await import("@google-cloud/storage");
	const gcs = config.keyFilename ? new Storage({ keyFilename: config.keyFilename }) : new Storage();
	const bucket = gcs.bucket(config.bucket);

	return {
		async write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void> {
			const buf = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;
			const file = bucket.file(key);
			if (options?.contentType) {
				await (file.save as (d: typeof buf, o?: { contentType?: string }) => Promise<void>)(buf, {
					contentType: options.contentType,
				});
			} else {
				await (file.save as (d: typeof buf) => Promise<void>)(buf);
			}
		},

		async read(key: string): Promise<Uint8Array | null> {
			try {
				const [buf] = await (bucket.file(key).download as () => Promise<[Buffer]>)();
				return new Uint8Array(buf);
			} catch {
				return null;
			}
		},

		async delete(key: string): Promise<void> {
			await (bucket.file(key).delete as () => Promise<void>)().catch(() => {});
		},

		async list(prefix?: string): Promise<string[]> {
			const [files] = await (bucket.getFiles as (o?: { prefix?: string }) => Promise<[{ name: string }[]]>)(
				prefix ? { prefix } : undefined,
			);
			return files.map((f: { name: string }) => f.name);
		},

		async exists(key: string): Promise<boolean> {
			const [exists] = await (bucket.file(key).exists as () => Promise<[boolean]>)();
			return exists;
		},

		async metadata(key: string): Promise<FileMetadata | null> {
			try {
				const [meta] = await (
					bucket.file(key).getMetadata as () => Promise<[{ size: string; contentType?: string }]>
				)();
				return {
					size: Number(meta.size) || 0,
					contentType: meta.contentType,
				};
			} catch {
				return null;
			}
		},

		url(key: string): string | undefined {
			return config.publicUrlBase ? `${config.publicUrlBase.replace(/\/$/, "")}/${key}` : undefined;
		},

		async clear(): Promise<void> {
			const [files] = await (bucket.getFiles as () => Promise<[{ name: string }[]]>)();
			await Promise.all(files.map((f: { name: string }) => (bucket.file(f.name).delete as () => Promise<void>)()));
		},
	};
}
