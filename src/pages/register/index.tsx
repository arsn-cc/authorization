import { RegisterForm } from "@/components/register-form";
import { NotFoundContent } from "@/components/not-found-content";
import { getSetting } from "@/lib/settings";

export default async function RegisterPage() {
	const registrationDisabled = (await getSetting("disable_registration")) === "true";

	if (registrationDisabled) {
		return <NotFoundContent />;
	}

	return <RegisterForm />;
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
