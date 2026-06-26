"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";
import { themeAtom } from "@/lib/state/theme";

type ThemeProviderProps = {
	children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
	const [theme] = useAtom(themeAtom);

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove("light", "dark");

		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

			root.classList.add(systemTheme);
			return;
		}

		root.classList.add(theme);
	}, [theme]);

	return children;
}

export const useTheme = () => {
	const [theme, setTheme] = useAtom(themeAtom);

	return { theme, setTheme };
};
