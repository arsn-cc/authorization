import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type Theme = "dark" | "light" | "system";

function getStringStorage() {
	try {
		return window.localStorage;
	} catch {
		return {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {},
		};
	}
}

const storage = createJSONStorage<Theme>(getStringStorage);

if (typeof window !== "undefined" && !storage.subscribe) {
	storage.subscribe = (key, callback, initialValue) => {
		const handler = (e: StorageEvent) => {
			if (e.storageArea === getStringStorage() && e.key === key) {
				try {
					callback(JSON.parse(e.newValue ?? "") as Theme);
				} catch {
					callback(initialValue);
				}
			}
		};
		window.addEventListener("storage", handler);
		return () => window.removeEventListener("storage", handler);
	};
}

export const themeAtom = atomWithStorage<Theme>("vite-ui-theme", "dark", storage);
