import type { FileStorage, FileMetadata } from "../types";

interface SupaBucket {
	upload(path: string, body: Blob, options?: { contentType?: string; upsert?: boolean }): Promise<{ error?: unknown }>;
	download(path: string): Promise<{ data?: Blob; error?: unknown }>;
	remove(paths: string[]): Promise<unknown>;
	list(options?: { prefix?: string; limit?: number }): Promise<{ data?: { name: string }[]; error?: unknown }>;
	info(path: string): Promise<{ data?: { metadata?: { size?: number; mimetype?: string } }; error?: unknown }>;
	getPublicUrl(path: string): { data: { publicUrl: string } };
}

export async function createSupabaseStorage(config: {
	url: string;
	anonKey: string;
	bucket: string;
	publicUrlBase?: string;
}): Promise<FileStorage> {
	const { createClient } = await import("@supabase/supabase-js");
	const supabase = createClient(config.url, config.anonKey);
	const bucketName = config.bucket;

	const supaApi = supabase.storage as {
		listBuckets(): Promise<{ data?: { name: string }[] }>;
		createBucket(name: string, options?: { public?: boolean }): Promise<unknown>;
		from(bucket: string): unknown;
	};

	async function ensureBucket() {
		const { data: buckets } = await supaApi.listBuckets();
		if (!buckets?.some((b: { name: string }) => b.name === bucketName)) {
			await supaApi.createBucket(bucketName, { public: !!config.publicUrlBase });
		}
	}
	await ensureBucket();

	const bucket = supaApi.from(bucketName) as SupaBucket;

	return {
		async write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void> {
			const blob =
				data instanceof Blob
					? data
					: typeof data === "string"
						? new Blob([data])
						: new Blob([data.buffer as ArrayBuffer]);
			const { error } = await bucket.upload(key, blob, {
				...(options?.contentType ? { contentType: options.contentType } : {}),
				upsert: true,
			});
			if (error) {
				throw error;
			}
		},

		async read(key: string): Promise<Uint8Array | null> {
			const { data, error } = await bucket.download(key);
			if (error || !data) {
				return null;
			}
			return new Uint8Array(await data.arrayBuffer());
		},

		async delete(key: string): Promise<void> {
			await bucket.remove([key]);
		},

		async list(prefix?: string): Promise<string[]> {
			const opts = prefix ? { prefix, limit: 1000 } : { limit: 1000 };
			const { data, error } = await bucket.list(opts);
			if (error || !data) {
				return [];
			}
			return data.map((f) => f.name);
		},

		async exists(key: string): Promise<boolean> {
			const { data } = await bucket.list({ prefix: key, limit: 1 });
			return (data ?? []).some((f) => f.name === key);
		},

		async metadata(key: string): Promise<FileMetadata | null> {
			const { data, error } = await bucket.info(key);
			if (error || !data) {
				return null;
			}
			return {
				size: data.metadata?.size ?? 0,
				contentType: data.metadata?.mimetype,
			};
		},

		url(key: string): string | undefined {
			if (config.publicUrlBase) {
				return `${config.publicUrlBase.replace(/\/$/, "")}/${key}`;
			}
			const { data } = bucket.getPublicUrl(key);
			return data.publicUrl;
		},

		async clear(): Promise<void> {
			const { data } = await bucket.list({ limit: 1000 });
			if (data && data.length > 0) {
				await bucket.remove(data.map((f) => f.name));
			}
		},
	};
}
