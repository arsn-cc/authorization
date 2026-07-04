"use client";

import { useEffect, useState } from "react";
import { Link } from "waku";

interface Props {
	token: string;
}

interface ResultState {
	type: "loading" | "success" | "error";
	message: string;
}

export function VerifyEmailClient({ token }: Props) {
	const [result, setResult] = useState<ResultState>({ type: "loading", message: "Verifying your email..." });

	useEffect(() => {
		fetch(`/_api/account/verify-email?token=${encodeURIComponent(token)}`)
			.then((res) => {
				if (res.ok) {
					return res.json();
				}
				return res.json().then((body) => Promise.reject(new Error(body.error ?? "verification_failed")));
			})
			.then(() => {
				setResult({ type: "success", message: "Your email has been verified successfully." });
				return;
			})
			.catch((err: Error) => {
				setResult({
					type: "error",
					message:
						err.message === "INVALID_TOKEN"
							? "This verification link has expired or is invalid."
							: "Something went wrong. Please try again.",
				});
			});
	}, [token]);

	if (result.type === "loading") {
		return (
			<>
				<div className="bg-muted mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
					<span className="text-muted-foreground text-sm">⏳</span>
				</div>
				<h1 className="text-3xl font-semibold tracking-tight">Verifying</h1>
				<p className="text-muted-foreground mt-4 text-sm">{result.message}</p>
			</>
		);
	}

	if (result.type === "success") {
		return (
			<>
				<div className="bg-muted mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
					<span className="text-sm text-green-500">✓</span>
				</div>
				<h1 className="text-3xl font-semibold tracking-tight">Email verified</h1>
				<p className="text-muted-foreground mt-4 text-sm">{result.message}</p>
				<Link to="/login" className="mt-6 inline-block text-sm font-medium underline underline-offset-4">
					Back to login
				</Link>
			</>
		);
	}

	return (
		<>
			<div className="bg-muted mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
				<span className="text-sm text-red-500">✕</span>
			</div>
			<h1 className="text-3xl font-semibold tracking-tight">Verification failed</h1>
			<p className="text-muted-foreground mt-4 text-sm">{result.message}</p>
			<Link to="/login" className="mt-6 inline-block text-sm font-medium underline underline-offset-4">
				Back to login
			</Link>
		</>
	);
}
