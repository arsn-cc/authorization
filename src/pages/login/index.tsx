import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
	const registrationDisabled = process.env.DISABLE_REGISTRATION === "true";
	return <LoginForm registrationDisabled={registrationDisabled} />;
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
