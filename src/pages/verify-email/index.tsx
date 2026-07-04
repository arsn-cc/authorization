import { VerifyEmailClient } from "@/components/verify-email-client";

export default function VerifyEmailPage({ query }: { query?: Record<string, string | string[]> }) {
	const tokenParam = query?.token;
	const token = typeof tokenParam === "string" ? tokenParam : "";

	if (!token) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Verify email - ARSN</title>
				<h1 className="text-3xl font-semibold tracking-tight">Verify your email</h1>
				<p className="text-muted-foreground mt-4 text-sm">Check your inbox for the verification link we sent you.</p>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
			<title>Verify email - ARSN</title>
			<VerifyEmailClient token={token} />
		</div>
	);
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
