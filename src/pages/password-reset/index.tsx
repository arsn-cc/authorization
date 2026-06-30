import { PasswordResetForm } from "@/components/password-reset-form";

export default function PasswordResetPage({ query }: { query?: Record<string, string | string[]> }) {
	const tokenParam = query?.token;
	const token = typeof tokenParam === "string" ? tokenParam : "";
	return (
		<>
			<meta name="referrer" content="no-referrer" />
			<PasswordResetForm token={token} />
		</>
	);
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
