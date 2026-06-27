import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	ListObjectsV2Command,
	HeadObjectCommand,
} from "@aws-sdk/client-s3";
import type { FileStorage, FileMetadata } from "./types";

export type { FileStorage, FileMetadata } from "./types";

let _storage: FileStorage | null = null;

export async function getStorage(): Promise<FileStorage> {
	if (_storage) {
		return _storage;
	}

	const bucket = process.env.STORAGE_BUCKET || "uploads";
	const region = process.env.STORAGE_REGION;
	const endpoint = process.env.STORAGE_ENDPOINT;
	const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
	const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
	const publicUrlBase = process.env.STORAGE_PUBLIC_URL;

	const client = new S3Client({
		...(region ? { region } : {}),
		...(endpoint ? { endpoint } : {}),
		...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
	});

	_storage = {
		async write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void> {
			await client.send(
				new PutObjectCommand({
					Bucket: bucket,
					Key: key,
					Body: data,
					...(options?.contentType ? { ContentType: options.contentType } : {}),
				}),
			);
		},

		async read(key: string): Promise<Uint8Array | null> {
			try {
				const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
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
			const result = await client.send(
				new ListObjectsV2Command({
					Bucket: bucket,
					...(prefix ? { Prefix: prefix } : {}),
				}),
			);
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
				const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
				return { size: head.ContentLength ?? 0, contentType: head.ContentType };
			} catch {
				return null;
			}
		},

		url(key: string): string | undefined {
			return publicUrlBase ? `${publicUrlBase.replace(/\/$/, "")}/${key}` : undefined;
		},

		async clear(): Promise<void> {
			const keys = await _storage!.list();
			await Promise.all(keys.map((k) => _storage!.delete(k)));
		},
	};

	return _storage;
}
