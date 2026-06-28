import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
	return <RegisterForm />;
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
