import "@/styles/globals.css";

import type { ReactNode } from "react";
import { RouterProvider } from "waku-jotai/router";
import { ThemeProvider } from "@/components/provider/theme-provider";
import { getSetting } from "@/lib/settings";

console.log(`[startup] db=postgres-js cache=redis storage=s3`);

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
	const data = await getData();
	const primaryColor = await getSetting("primary_color");

	return (
		<div className="font-['Nunito']">
			<meta name="description" content={data.description} />
			<link rel="icon" type="image/png" href={data.icon} />
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
			<link
				rel="stylesheet"
				href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,700;1,400;1,700&display=swap"
				precedence="font"
			/>
			<script
				dangerouslySetInnerHTML={{
					__html: `
						(function(){try{var e=localStorage.getItem("vite-ui-theme");if(e==="dark"||(!e&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})();
					`,
				}}
			/>
			{primaryColor && (
				<style>{`
					:root, .dark {
						--primary: ${primaryColor};
						--chart-4: ${primaryColor};
						--sidebar-primary: ${primaryColor};
					}
				`}</style>
			)}
			<main className="m-6 flex items-center *:min-h-64 *:min-w-64 lg:m-0 lg:min-h-svh lg:justify-center">
				<RouterProvider>
					<ThemeProvider>{children}</ThemeProvider>
				</RouterProvider>
			</main>
		</div>
	);
}

const getData = async () => {
	const data = {
		description: "An internet website!",
		icon: "/images/favicon.png",
	};

	return data;
};

export const getConfig = async () => {
	return {
		render: "dynamic",
	} as const;
};
