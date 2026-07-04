import { UnlockAccountClient } from "@/components/unlock-account-client";

export default function UnlockAccountPage({ query }: { query?: Record<string, string | string[]> }) {
	const tokenParam = query?.token;
	const token = typeof tokenParam === "string" ? tokenParam : "";

	if (!token) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Unlock account - ARSN</title>
				<h1 className="text-3xl font-semibold tracking-tight">Unlock account</h1>
				<p className="text-muted-foreground mt-4 text-sm">
					Check your inbox for the unlock link we sent when your account was locked.
				</p>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
			<title>Unlock account - ARSN</title>
			<UnlockAccountClient token={token} />
		</div>
	);
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
