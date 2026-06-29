import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
	return <ForgotPasswordForm />;
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
