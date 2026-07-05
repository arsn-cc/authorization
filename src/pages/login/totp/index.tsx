import { TotpForm } from "@/components/totp-form";

export default function TotpPage({ query }: { query?: Record<string, string | string[]> }) {
	const p = query?.p;
	const pendingAuthToken = typeof p === "string" ? p : "";

	if (!pendingAuthToken) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Two-factor authentication</title>
				<h1 className="text-3xl font-semibold tracking-tight">Invalid link</h1>
				<p className="text-muted-foreground mt-4 text-sm">No pending authentication session found.</p>
			</div>
		);
	}

	return <TotpForm pendingAuthToken={pendingAuthToken} />;
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
