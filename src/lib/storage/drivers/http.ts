import type { FileStorage, FileMetadata } from "../types";

export async function createHttpStorage(config: {
	baseUrl: string;
	headers?: Record<string, string>;
	publicUrlBase?: string;
}): Promise<FileStorage> {
	const base = config.baseUrl.replace(/\/$/, "");
	const defaultHeaders: Record<string, string> = config.headers ?? {};

	return {
		async write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void> {
			const hdrs = { ...defaultHeaders };
			if (options?.contentType) {
				hdrs["Content-Type"] = options.contentType;
			}
			const body = data instanceof Blob ? data : (data as BodyInit);
			const res = await fetch(`${base}/${key}`, { method: "PUT", headers: hdrs, body });
			if (!res.ok) {
				throw new Error(`HTTP write failed: ${res.status}`);
			}
		},

		async read(key: string): Promise<Uint8Array | null> {
			try {
				const res = await fetch(`${base}/${key}`, { method: "GET", headers: defaultHeaders });
				if (!res.ok) {
					return null;
				}
				return new Uint8Array(await res.arrayBuffer());
			} catch {
				return null;
			}
		},

		async delete(key: string): Promise<void> {
			const res = await fetch(`${base}/${key}`, { method: "DELETE", headers: defaultHeaders });
			if (!res.ok) {
				throw new Error(`HTTP delete failed: ${res.status}`);
			}
		},

		async list(_prefix?: string): Promise<string[]> {
			throw new Error("HTTP storage does not support listing");
		},

		async exists(key: string): Promise<boolean> {
			try {
				const res = await fetch(`${base}/${key}`, { method: "HEAD", headers: defaultHeaders });
				return res.ok;
			} catch {
				return false;
			}
		},

		async metadata(key: string): Promise<FileMetadata | null> {
			try {
				const res = await fetch(`${base}/${key}`, { method: "HEAD", headers: defaultHeaders });
				if (!res.ok) {
					return null;
				}
				return {
					size: Number(res.headers.get("Content-Length")) || 0,
					contentType: res.headers.get("Content-Type") ?? undefined,
				};
			} catch {
				return null;
			}
		},

		url(key: string): string | undefined {
			if (config.publicUrlBase) {
				return `${config.publicUrlBase.replace(/\/$/, "")}/${key}`;
			}
			return `${base}/${key}`;
		},

		async clear(): Promise<void> {
			throw new Error("HTTP storage does not support clear");
		},
	};
}
