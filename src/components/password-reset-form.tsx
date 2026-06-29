"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Field, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { resetPasswordWithToken } from "@/lib/auth";
import type { AuthResult } from "@/lib/auth/types";
import { Link } from "waku";

async function resetAction(prevState: AuthResult<true> | null, formData: FormData): Promise<AuthResult<true> | null> {
	const token = formData.get("token") as string;
	const password = formData.get("password") as string;
	return resetPasswordWithToken({ token, password });
}

export function PasswordResetForm({ token }: { token: string }) {
	const [state, formAction, isPending] = useActionState(resetAction, null);

	if (state?.success === true) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Password Reset - ARSN</title>
				<h1 className="text-3xl font-semibold tracking-tight">Password reset</h1>
				<p className="text-muted-foreground mt-4 text-sm">
					Your password has been updated. You can now log in with your new password.
				</p>
				<Link to="/login" className="mt-6 inline-block text-sm font-medium underline underline-offset-4">
					Back to login
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8">
			<title>Reset password - ARSN</title>
			<h1 className="text-center text-3xl font-semibold tracking-tight">Reset password</h1>

			<form action={formAction} className="mt-6 space-y-4">
				<input type="hidden" name="token" value={token} />

				<Field>
					<FieldLegend variant="label">New password</FieldLegend>
					<Input name="password" type="password" placeholder="At least 8 characters" required minLength={8} />
				</Field>

				<Field>
					<FieldLegend variant="label">Confirm new password</FieldLegend>
					<Input name="confirmPassword" type="password" placeholder="Repeat the new password" required minLength={8} />
				</Field>

				{state?.success === false && <p className="text-destructive text-sm">{state.error.message}</p>}

				<Button type="submit" className="w-full" disabled={isPending}>
					{isPending ? "Resetting..." : "Reset password"}
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
