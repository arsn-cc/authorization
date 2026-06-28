import { RegisterForm } from "@/components/register-form";
import { NotFoundContent } from "@/components/not-found-content";

export default function RegisterPage() {
	if (process.env.DISABLE_REGISTRATION === "true") {
		return <NotFoundContent />;
	}

	return <RegisterForm />;
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
