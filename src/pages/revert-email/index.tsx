import { RevertEmailClient } from "@/components/revert-email-client";

export default function RevertEmailPage({ query }: { query?: Record<string, string | string[]> }) {
	const tokenParam = query?.token;
	const token = typeof tokenParam === "string" ? tokenParam : "";

	if (!token) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Revert email</title>
				<h1 className="text-3xl font-semibold tracking-tight">Revert email change</h1>
				<p className="text-muted-foreground mt-4 text-sm">
					Check your inbox for the revert link we sent when your email was changed.
				</p>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
			<title>Revert email</title>
			<RevertEmailClient token={token} />
		</div>
	);
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
