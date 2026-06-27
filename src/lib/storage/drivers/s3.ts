import type { FileStorage, FileMetadata } from "../types";

export async function createS3Storage(config: {
	bucket: string;
	region?: string;
	endpoint?: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	publicUrlBase?: string;
}): Promise<FileStorage> {
	const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } =
		await import("@aws-sdk/client-s3");

	const client = new S3Client({
		...(config.region ? { region: config.region } : {}),
		...(config.endpoint ? { endpoint: config.endpoint } : {}),
		...(config.accessKeyId && config.secretAccessKey
			? { credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } }
			: {}),
	} as never);

	const bucket = config.bucket;

	const storage: FileStorage = {
		async write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void> {
			const cmd = new PutObjectCommand({
				Bucket: bucket,
				Key: key,
				Body: data,
				...(options?.contentType ? { ContentType: options.contentType } : {}),
			});
			await client.send(cmd);
		},

		async read(key: string): Promise<Uint8Array | null> {
			try {
				const result = (await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))) as {
					Body?: { transformToByteArray(): Promise<Uint8Array> };
				};
				if (!result.Body) {
					return null;
				}
				return await result.Body.transformToByteArray();
			} catch {
				return null;
			}
		},

		async delete(key: string): Promise<void> {
			await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
		},

		async list(prefix?: string): Promise<string[]> {
			const result = (await client.send(
				new ListObjectsV2Command({
					Bucket: bucket,
					...(prefix ? { Prefix: prefix } : {}),
				}),
			)) as { Contents?: { Key?: string }[] };
			return (result.Contents ?? []).map((c) => c.Key!).filter(Boolean);
		},

		async exists(key: string): Promise<boolean> {
			try {
				await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
				return true;
			} catch {
				return false;
			}
		},

		async metadata(key: string): Promise<FileMetadata | null> {
			try {
				const head = (await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))) as {
					ContentLength?: number;
					ContentType?: string;
				};
				return {
					size: head.ContentLength ?? 0,
					contentType: head.ContentType,
				};
			} catch {
				return null;
			}
		},

		url(key: string): string | undefined {
			return config.publicUrlBase ? `${config.publicUrlBase.replace(/\/$/, "")}/${key}` : undefined;
		},

		async clear(): Promise<void> {
			const keys = await storage.list();
			await Promise.all(keys.map((k) => storage.delete(k)));
		},
	};

	return storage;
}
