import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
	if (process.env.DISABLE_REGISTRATION === "true") {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Registration disabled</title>
				<h1 className="text-3xl font-semibold tracking-tight">Register</h1>
				<p className="text-muted-foreground mt-4">Registration is currently disabled.</p>
			</div>
		);
	}

	return <RegisterForm />;
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
