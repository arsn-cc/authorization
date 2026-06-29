"use client";

import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Field, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { verifyTotpAndLogin } from "@/lib/auth";
import type { AuthResult, LoginResult } from "@/lib/auth/types";
import { Link } from "waku";

function setSessionCookie(token: string, expires: Date) {
	const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000));
	document.cookie = `session_token=${encodeURIComponent(token)}; Path=/; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

async function totpAction(
	prevState: AuthResult<LoginResult> | null,
	formData: FormData,
): Promise<AuthResult<LoginResult> | null> {
	const pendingAuthToken = formData.get("pendingAuthToken") as string;
	const totpCode = formData.get("totpCode") as string;
	return verifyTotpAndLogin({ pendingAuthToken, totpCode });
}

export function TotpForm({ pendingAuthToken }: { pendingAuthToken: string }) {
	const [state, formAction, isPending] = useActionState(totpAction, null);

	useEffect(() => {
		if (state?.success === true) {
			setSessionCookie(state.data.token, state.data.expires);
			window.location.href = "https://arsn.cc";
		}
	}, [state]);

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8">
			<title>Two-factor authentication - ARSN</title>
			<h1 className="text-center text-3xl font-semibold tracking-tight">Two-factor auth</h1>
			<p className="text-muted-foreground mt-2 text-center text-sm">Enter the code from your authenticator app.</p>

			<form action={formAction} className="mt-6 space-y-4">
				<input type="hidden" name="pendingAuthToken" value={pendingAuthToken} />

				<Field>
					<FieldLegend variant="label">Authentication code</FieldLegend>
					<Input
						name="totpCode"
						type="text"
						inputMode="numeric"
						autoComplete="one-time-code"
						placeholder="000000"
						required
						disabled={isPending}
						className="text-center text-2xl tracking-widest"
						maxLength={6}
					/>
				</Field>

				{state?.success === false && <p className="text-destructive text-sm">{state.error.message}</p>}

				<Button type="submit" className="w-full" disabled={isPending}>
					{isPending ? "Verifying..." : "Verify"}
				</Button>
			</form>

			<p className="text-muted-foreground mt-8 text-center text-sm">
				<Link to="/login" className="text-foreground font-medium underline underline-offset-4">
					Back to login
				</Link>
			</p>
		</div>
	);
}
