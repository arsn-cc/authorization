"use client";

import { useActionState, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Field, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { requestEmailTwoFactorLink, verifyEmailTwoFactorAndLogin } from "@/lib/auth";
import type { AuthResult, LoginResult } from "@/lib/auth/types";
import { Link } from "waku";
import { SESSION_COOKIE_NAME } from "@/lib/auth/utils";

function setSessionCookie(token: string, expires: Date) {
	const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000));
	document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function EmailTwoFactorForm({
	pendingAuthToken,
	email,
	code,
}: {
	pendingAuthToken: string;
	email: string;
	code: string;
}) {
	const [codeSent, setCodeSent] = useState(false);
	const [verifyState, verifyAction, isVerifying] = useActionState(
		async (prevState: AuthResult<LoginResult> | null, formData: FormData): Promise<AuthResult<LoginResult> | null> => {
			const c = formData.get("code") as string;
			return verifyEmailTwoFactorAndLogin({ pendingAuthToken, emailCode: c });
		},
		null,
	);

	useEffect(() => {
		if (verifyState?.success === true) {
			setSessionCookie(verifyState.data.token, verifyState.data.expires);
			window.location.href = "https://arsn.cc";
		}
	}, [verifyState]);

	useEffect(() => {
		if (!codeSent && !code) {
			setCodeSent(true);
			void requestEmailTwoFactorLink({ email, pendingAuthToken });
		}
	}, [email, pendingAuthToken, code, codeSent]);

	useEffect(() => {
		if (code && pendingAuthToken) {
			void verifyEmailTwoFactorAndLogin({
				pendingAuthToken,
				emailCode: code,
			}).then((result) => {
				if (result.success) {
					setSessionCookie(result.data.token, result.data.expires);
					window.location.href = "https://arsn.cc";
				}
				return;
			});
		}
	}, [code, pendingAuthToken]);

	const showForm = !code || verifyState?.success === false;

	if (verifyState?.success === true) {
		return null;
	}

	if (!showForm) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Verifying sign-in - ARSN</title>
				<h1 className="text-3xl font-semibold tracking-tight">Verifying...</h1>
				<p className="text-muted-foreground mt-4 text-sm">Please wait while we verify your sign-in.</p>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8">
			<title>Two-factor authentication - ARSN</title>
			<h1 className="text-center text-3xl font-semibold tracking-tight">Check your email</h1>
			<p className="text-muted-foreground mt-2 text-center text-sm">
				We sent a verification link to <span className="text-foreground font-medium">{email}</span>.
				{codeSent && " If you don't see it, check your spam folder."}
			</p>

			<form action={verifyAction} className="mt-6 space-y-4">
				<Field>
					<FieldLegend variant="label">Verification code</FieldLegend>
					<Input name="code" type="text" placeholder="Paste the code from the email" required disabled={isVerifying} />
				</Field>

				{verifyState?.success === false && <p className="text-destructive text-sm">{verifyState.error.message}</p>}

				<Button type="submit" className="w-full" disabled={isVerifying}>
					{isVerifying ? "Verifying..." : "Verify"}
				</Button>
			</form>

			<div className="mt-4 text-center">
				<button
					type="button"
					disabled={codeSent}
					onClick={() => {
						setCodeSent(true);
						void requestEmailTwoFactorLink({ email, pendingAuthToken });
					}}
					className="text-muted-foreground text-sm underline underline-offset-4 disabled:opacity-50"
				>
					{codeSent ? "Email sent" : "Resend email"}
				</button>
			</div>

			<p className="text-muted-foreground mt-8 text-center text-sm">
				<Link to="/login" className="text-foreground font-medium underline underline-offset-4">
					Back to login
				</Link>
			</p>
		</div>
	);
}
