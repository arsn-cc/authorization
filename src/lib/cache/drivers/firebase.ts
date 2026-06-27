import type { Cache } from "../types";

export async function createFirebaseCache(config: {
	databaseUrl: string;
	serviceAccount?: Record<string, unknown>;
	defaultTtl: number;
	keyPrefix: string;
}): Promise<Cache> {
	const { initializeApp, cert } = await import("firebase-admin/app");
	const { getDatabase, ref, get, set, remove } = await import("firebase-admin/database");

	const app = config.serviceAccount
		? initializeApp({
				databaseURL: config.databaseUrl,
				credential: cert(config.serviceAccount as never),
			})
		: initializeApp({ databaseURL: config.databaseUrl });

	const db = getDatabase(app);
	const prefix = config.keyPrefix;

	function prefixed(key: string): string {
		return prefix ? `${prefix}/${key}`.replace(/[.#$[\]]/g, "_") : key.replace(/[.#$[\]]/g, "_");
	}

	return {
		async get<T>(key: string): Promise<T | null> {
			const snap = await get(ref(db, prefixed(key)));
			if (!snap.exists()) {
				return null;
			}
			const entry = snap.val() as { value: T; expiresAt?: number };
			if (entry.expiresAt && entry.expiresAt <= Date.now()) {
				await remove(ref(db, prefixed(key)));
				return null;
			}
			return entry.value;
		},

		async set(key: string, value: unknown, ttl?: number): Promise<void> {
			const t = ttl ?? config.defaultTtl;
			await set(ref(db, prefixed(key)), {
				value,
				expiresAt: t > 0 ? Date.now() + t * 1000 : null,
			});
		},

		async delete(key: string): Promise<void> {
			await remove(ref(db, prefixed(key)));
		},

		async clear(): Promise<void> {
			const rootRef = ref(db, prefix || "/");
			await set(rootRef, null);
		},

		async has(key: string): Promise<boolean> {
			const snap = await get(ref(db, prefixed(key)));
			if (!snap.exists()) {
				return false;
			}
			const entry = snap.val() as { expiresAt?: number };
			if (entry.expiresAt && entry.expiresAt <= Date.now()) {
				await remove(ref(db, prefixed(key)));
				return false;
			}
			return true;
		},
	};
}
