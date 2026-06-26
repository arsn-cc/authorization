import path from "node:path";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "waku/config";

export default defineConfig({
	vite: {
		resolve: {
			alias: {
				"@": path.resolve(import.meta.dirname, "./src"),
			},
		},
		plugins: [tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
		optimizeDeps: {
			exclude: ["waku-jotai"],
		},
		ssr: {
			noExternal: ["waku-jotai", "jotai"],
		},
	},
});
