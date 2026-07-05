"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Field, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/lib/auth";
import type { AuthResult } from "@/lib/auth/types";
import { Link } from "waku";

async function forgotAction(_prevState: AuthResult<true> | null, formData: FormData): Promise<AuthResult<true> | null> {
	const email = formData.get("email") as string;
	return requestPasswordReset({ email });
}

export function ForgotPasswordForm() {
	const [state, formAction, isPending] = useActionState(forgotAction, null);

	if (state?.success === true) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Check your email</title>
				<h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
				<p className="text-muted-foreground mt-4 text-sm">
					If an account with that email exists, you'll receive a password reset link shortly.
				</p>
				<Link to="/login" className="mt-6 inline-block text-sm font-medium underline underline-offset-4">
					Back to login
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8">
			<title>Forgot password</title>
			<h1 className="text-center text-3xl font-semibold tracking-tight">Forgot password</h1>

			<form action={formAction} className="mt-6 space-y-4">
				<Field>
					<FieldLegend variant="label">Email address</FieldLegend>
					<Input name="email" type="email" placeholder="Enter your email" required disabled={isPending} />
				</Field>

				{state?.success === false && <p className="text-destructive text-sm">{state.error.message}</p>}

				<Button type="submit" className="w-full" disabled={isPending}>
					{isPending ? "Sending..." : "Send reset link"}
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
