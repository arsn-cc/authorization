"use client";

import { useActionState } from "react";
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
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	return loginUser({ email, password });
}

export function LoginForm() {
	const [state, formAction, isPending] = useActionState(loginAction, null);

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8">
			<title>Log in to ARSN</title>

			<h1 className="text-center text-3xl font-semibold tracking-tight">Login</h1>

			<form action={formAction} className="mt-6 space-y-4">
				<Field>
					<FieldLegend variant="label">Email</FieldLegend>
					<Input name="email" type="email" placeholder="name@example.com" required disabled={isPending} />
				</Field>

				<Field>
					<FieldLegend variant="label">Password</FieldLegend>
					<Input name="password" type="password" placeholder="Enter your password" required disabled={isPending} />
				</Field>

				{state?.success === false && <p className="text-destructive text-sm">{state.error.message}</p>}

				{state?.success === true && <p className="text-sm text-green-600">Logged in successfully!</p>}

				<Button type="submit" className="w-full" disabled={isPending}>
					{isPending ? "Logging in..." : "Log in"}
				</Button>
			</form>

			<p className="text-muted-foreground mt-8 text-center text-sm">
				Don't have an account?{" "}
				<Link to="/register" className="text-foreground font-medium underline underline-offset-4">
					Sign up
				</Link>
			</p>
		</div>
	);
}
