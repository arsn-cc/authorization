import { Link } from "waku";

export default function VerifyEmailPage({ query }: { query?: Record<string, string | string[]> }) {
	const token = query?.token;
	const tokenParam = typeof token === "string" ? token : "";

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
			<title>Verify email - ARSN</title>
			<h1 className="text-3xl font-semibold tracking-tight">Email verification moved</h1>
			<p className="text-muted-foreground mt-4 text-sm">
				Email verification is now handled during sign-in.{" "}
				{tokenParam && "If you have a pending sign-in, please use the link from your email."}
			</p>
			<Link to="/login" className="mt-6 inline-block text-sm font-medium underline underline-offset-4">
				Back to login
			</Link>
		</div>
	);
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
