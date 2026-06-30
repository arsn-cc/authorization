"use client";

import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Field, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { loginUser } from "@/lib/auth";
import type { AuthResult, LoginResult, PendingLoginResult } from "@/lib/auth/types";
import { Link } from "waku";
import { SESSION_COOKIE_NAME } from "@/lib/auth/utils";

async function loginAction(
	prevState: AuthResult<LoginResult | PendingLoginResult> | null,
	formData: FormData,
): Promise<AuthResult<LoginResult | PendingLoginResult> | null> {
	const login = formData.get("login") as string;
	const password = formData.get("password") as string;
	return loginUser({ login, password });
}

function setSessionCookie(token: string, expires: Date) {
	const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000));
	document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function getPendingRedirectUrl(data: LoginResult | PendingLoginResult): string | null {
	if ("pendingAuthToken" in data && data.pendingAuthToken) {
		const pending = data.pendingAuthToken;
		const methods = data.methods ?? [];
		// Prefer TOTP over email if both are required
		if (methods.includes("totp")) {
			return `/login/totp?p=${encodeURIComponent(pending)}`;
		}
		if (methods.includes("email")) {
			return `/login/e-2fa?p=${encodeURIComponent(pending)}`;
		}
	}
	return null;
}

export function LoginForm({ registrationDisabled }: { registrationDisabled?: boolean }) {
	const [state, formAction, isPending] = useActionState(loginAction, null);

	useEffect(() => {
		if (state?.success === true) {
			const data = state.data;
			const redirect = getPendingRedirectUrl(data);
			if (redirect) {
				window.location.href = redirect;
				return;
			}
			if ("token" in data && data.token) {
				setSessionCookie(data.token, data.expires);
				window.location.href = "https://arsn.cc";
			}
		}
	}, [state]);

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8">
			<title>Log in to ARSN</title>

			<h1 className="text-center text-3xl font-semibold tracking-tight">Login</h1>

			<form action={formAction} className="mt-6 space-y-4">
				<Field>
					<FieldLegend variant="label">Username or Email</FieldLegend>
					<Input name="login" placeholder="username or email" required disabled={isPending} />
				</Field>

				<Field>
					<FieldLegend variant="label">Password</FieldLegend>
					<Input name="password" type="password" placeholder="Enter your password" required disabled={isPending} />
				</Field>

				{state?.success === false && <p className="text-destructive text-sm">{state.error.message}</p>}

				<Button type="submit" className="w-full" disabled={isPending}>
					{isPending ? "Logging in..." : "Log in"}
				</Button>

				<p className="text-center text-sm">
					<Link to="/forgot-password" className="text-muted-foreground underline underline-offset-4">
						Forgot password?
					</Link>
				</p>
			</form>

			{!registrationDisabled && (
				<p className="text-muted-foreground mt-8 text-center text-sm">
					Don't have an account?{" "}
					<Link to="/register" className="text-foreground font-medium underline underline-offset-4">
						Sign up
					</Link>
				</p>
			)}
		</div>
	);
}
