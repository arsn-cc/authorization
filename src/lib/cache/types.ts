export interface CacheEntry<T> {
	value: T;
	expiresAt: number | null;
}

export interface Cache {
	get<T>(key: string): Promise<T | null>;
	set(key: string, value: unknown, ttl?: number): Promise<void>;
	delete(key: string): Promise<void>;
	clear(): Promise<void>;
	has(key: string): Promise<boolean>;
}
