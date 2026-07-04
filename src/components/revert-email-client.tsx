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

export function RevertEmailClient({ token }: Props) {
	const [result, setResult] = useState<ResultState>({ type: "loading", message: "Reverting email change..." });

	useEffect(() => {
		fetch(`/_api/account/revert-email?token=${encodeURIComponent(token)}`)
			.then((res) => {
				if (res.ok) {
					return res.json();
				}
				return res.json().then((body) => Promise.reject(new Error(body.error ?? "revert_failed")));
			})
			.then(() => {
				setResult({ type: "success", message: "Your email address has been reverted to the previous one." });
				return;
			})
			.catch((err: Error) => {
				setResult({
					type: "error",
					message:
						err.message === "INVALID_TOKEN"
							? "This revert link has expired or is invalid."
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
				<h1 className="text-3xl font-semibold tracking-tight">Reverting email</h1>
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
				<h1 className="text-3xl font-semibold tracking-tight">Email reverted</h1>
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
			<h1 className="text-3xl font-semibold tracking-tight">Revert failed</h1>
			<p className="text-muted-foreground mt-4 text-sm">{result.message}</p>
			<Link to="/login" className="mt-6 inline-block text-sm font-medium underline underline-offset-4">
				Back to login
			</Link>
		</>
	);
}
