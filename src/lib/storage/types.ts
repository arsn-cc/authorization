export interface FileMetadata {
	size: number;
	contentType: string | undefined;
}

export interface FileStorage {
	write(key: string, data: Uint8Array | Blob | string, options?: { contentType?: string }): Promise<void>;
	read(key: string): Promise<Uint8Array | null>;
	delete(key: string): Promise<void>;
	list(prefix?: string): Promise<string[]>;
	exists(key: string): Promise<boolean>;
	metadata(key: string): Promise<FileMetadata | null>;
	url(key: string): string | undefined;
	clear(): Promise<void>;
}
