declare module "@aws-sdk/client-s3" {
	export class S3Client {
		constructor(config: Record<string, unknown>);
		send(command: unknown): Promise<unknown>;
	}
	export class PutObjectCommand {
		constructor(input: { Bucket: string; Key: string; Body: string | Uint8Array | Blob; ContentType?: string });
	}
	export class GetObjectCommand {
		constructor(input: { Bucket: string; Key: string });
	}
	export class DeleteObjectCommand {
		constructor(input: { Bucket: string; Key: string });
	}
	export class ListObjectsV2Command {
		constructor(input: { Bucket: string; Prefix?: string });
	}
	export class HeadObjectCommand {
		constructor(input: { Bucket: string; Key: string });
	}
}

declare module "@google-cloud/storage" {
	export class Storage {
		constructor(config?: { keyFilename?: string });
		bucket(name: string): {
			file(path: string): {
				save(data: string | Uint8Array, options?: { contentType?: string }): Promise<void>;
				download(): Promise<[Buffer]>;
				delete(): Promise<void>;
				exists(): Promise<[boolean]>;
				getMetadata(): Promise<[{ size: string; contentType?: string }]>;
			};
			getFiles(options?: { prefix?: string }): Promise<[{ name: string }[]]>;
		};
	}
}

declare module "@azure/storage-blob" {
	export class BlobServiceClient {
		static fromConnectionString(connectionString: string): BlobServiceClient;
		getContainerClient(containerName: string): {
			createIfNotExists(): Promise<unknown>;
			getBlockBlobClient(blobName: string): {
				url: string;
				uploadData(
					data: ArrayBuffer | Uint8Array | Blob | string,
					options?: {
						blobHTTPHeaders?: { blobContentType?: string };
					},
				): Promise<unknown>;
				download(): Promise<{ readableStream?: NodeJS.ReadableStream }>;
				exists(): Promise<boolean>;
				getProperties(): Promise<{ contentLength?: number; contentType?: string }>;
			};
			deleteBlob(name: string): Promise<unknown>;
			listBlobsFlat(options?: { prefix?: string }): AsyncIterable<{ name: string }>;
		};
	}
}

declare module "@supabase/supabase-js" {
	export function createClient(
		url: string,
		anonKey: string,
	): {
		storage: {
			listBuckets(): Promise<{ data?: { name: string }[]; error?: unknown }>;
			createBucket(name: string, options?: { public?: boolean }): Promise<unknown>;
			from(bucket: string): {
				upload(
					path: string,
					body: Blob,
					options?: {
						contentType?: string;
						upsert?: boolean;
					},
				): Promise<{ error?: unknown }>;
				download(path: string): Promise<{ data?: Blob; error?: unknown }>;
				remove(paths: string[]): Promise<unknown>;
				list(options?: { prefix?: string; limit?: number }): Promise<{
					data?: { name: string }[];
					error?: unknown;
				}>;
				info(path: string): Promise<{
					data?: { metadata?: { size?: number; mimetype?: string } };
					error?: unknown;
				}>;
				getPublicUrl(path: string): { data: { publicUrl: string } };
			};
		};
	};
}

declare module "webdav" {
	export function createClient(
		url: string,
		options?: {
			username?: string;
			password?: string;
		},
	): {
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
}
