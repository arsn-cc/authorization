import { verifyEmailTwoFactorToken } from "@/lib/auth";
import { Link } from "waku";

export default async function VerifyEmailPage({ query }: { query?: Record<string, string | string[]> }) {
	const tokenParam = query?.token;
	const token = typeof tokenParam === "string" ? tokenParam : "";

	if (!token) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Verify email - ARSN</title>
				<h1 className="text-3xl font-semibold tracking-tight">Invalid link</h1>
				<p className="text-muted-foreground mt-4 text-sm">No verification token provided.</p>
				<Link to="/login" className="mt-6 inline-block text-sm font-medium underline underline-offset-4">
					Back to login
				</Link>
			</div>
		);
	}

	const result = await verifyEmailTwoFactorToken({ token });

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
			<title>Verify email - ARSN</title>

			{result.success ? (
				<>
					<h1 className="text-3xl font-semibold tracking-tight">Email verified</h1>
					<p className="text-muted-foreground mt-4 text-sm">
						Your sign-in has been verified. You can now close this page and return to the app.
					</p>
				</>
			) : (
				<>
					<h1 className="text-3xl font-semibold tracking-tight">Verification failed</h1>
					<p className="text-muted-foreground mt-4 text-sm">{result.error.message}</p>
				</>
			)}

			<Link to="/login" className="mt-6 inline-block text-sm font-medium underline underline-offset-4">
				Back to login
			</Link>
		</div>
	);
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
