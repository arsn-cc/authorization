import { unstable_notFound } from "waku/router/server";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
	if (process.env.DISABLE_REGISTRATION === "true") {
		unstable_notFound();
	}

	return <RegisterForm />;
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
