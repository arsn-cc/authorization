import { DeleteAccountClient } from "@/components/delete-account-client";

export default function DeleteAccountPage({ query }: { query?: Record<string, string | string[]> }) {
	const tokenParam = query?.token;
	const token = typeof tokenParam === "string" ? tokenParam : "";

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
			<title>Delete account - ARSN</title>
			<DeleteAccountClient token={token} />
		</div>
	);
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
