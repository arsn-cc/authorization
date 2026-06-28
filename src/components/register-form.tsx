"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Field, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/lib/auth";
import type { AuthResult, UserResult } from "@/lib/auth/types";
import { Link } from "waku";

async function registerAction(
	_prevState: AuthResult<UserResult> | null,
	formData: FormData,
): Promise<AuthResult<UserResult> | null> {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const name = formData.get("name") as string;
	return registerUser({ email, password, ...(name ? { name } : {}) });
}

export function RegisterForm() {
	const [state, formAction, isPending] = useActionState(registerAction, null);

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8">
			<title>Create an ARSN account</title>

			<h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
			<p className="text-muted-foreground mt-2">Enter your details to get started</p>

			<form action={formAction} className="mt-6 space-y-4">
				<Field>
					<FieldLegend variant="label">Name</FieldLegend>
					<Input name="name" placeholder="John Doe" disabled={isPending} />
				</Field>

				<Field>
					<FieldLegend variant="label">Email</FieldLegend>
					<Input name="email" type="email" placeholder="name@example.com" required disabled={isPending} />
				</Field>

				<Field>
					<FieldLegend variant="label">Password</FieldLegend>
					<Input
						name="password"
						type="password"
						placeholder="Create a password (min. 8 characters)"
						required
						disabled={isPending}
					/>
				</Field>

				{state?.success === false && <p className="text-destructive text-sm">{state.error.message}</p>}

				{state?.success === true && <p className="text-sm text-green-600">Account created successfully!</p>}

				<Button type="submit" className="w-full" disabled={isPending}>
					{isPending ? "Creating account..." : "Create account"}
				</Button>
			</form>

			<p className="text-muted-foreground mt-8 text-center text-sm">
				Already have an account?{" "}
				<Link to="/login" className="text-foreground font-medium underline underline-offset-4">
					Log in
				</Link>
			</p>
		</div>
	);
}
