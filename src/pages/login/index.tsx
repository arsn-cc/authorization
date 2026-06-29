import { LoginForm } from "@/components/login-form";
import { getSetting } from "@/lib/settings";

export default async function LoginPage() {
	const registrationDisabled = (await getSetting("disable_registration")) === "true";
	return <LoginForm registrationDisabled={registrationDisabled} />;
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
