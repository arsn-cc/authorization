"use client";

import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Field, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { loginUser } from "@/lib/auth";
import type { AuthResult, LoginResult } from "@/lib/auth/types";
import { Link } from "waku";

async function loginAction(
	prevState: AuthResult<LoginResult> | null,
	formData: FormData,
): Promise<AuthResult<LoginResult> | null> {
	const login = formData.get("login") as string;
	const password = formData.get("password") as string;
	return loginUser({ login, password });
}

function setSessionCookie(token: string, expires: Date) {
	const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000));
	document.cookie = `session_token=${encodeURIComponent(token)}; Path=/; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function LoginForm({ registrationDisabled }: { registrationDisabled?: boolean }) {
	const [state, formAction, isPending] = useActionState(loginAction, null);

	useEffect(() => {
		if (state?.success === true) {
			setSessionCookie(state.data.token, state.data.expires);
			window.location.href = "https://arsn.cc";
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
