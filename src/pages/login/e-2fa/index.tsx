import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { hashSecret } from "@/lib/auth/utils";
import { getUserById } from "@/lib/auth/cache";
import { EmailTwoFactorForm } from "@/components/email-two-factor-form";

export default async function EmailTwoFactorPage({ query }: { query?: Record<string, string | string[]> }) {
	const p = query?.p;
	const c = query?.c;
	const pendingAuthToken = typeof p === "string" ? p : "";
	const code = typeof c === "string" ? c : "";

	if (!pendingAuthToken) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Two-factor authentication - ARSN</title>
				<h1 className="text-3xl font-semibold tracking-tight">Invalid link</h1>
				<p className="text-muted-foreground mt-4 text-sm">No pending authentication session found.</p>
			</div>
		);
	}

	const db = await getDb();
	const tokenHash = hashSecret(pendingAuthToken);
	const [pending] = await db
		.select({ userId: schema.pendingAuthToken.userId })
		.from(schema.pendingAuthToken)
		.where(and(eq(schema.pendingAuthToken.tokenHash, tokenHash), isNull(schema.pendingAuthToken.usedAt)))
		.limit(1);

	if (!pending) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Two-factor authentication - ARSN</title>
				<h1 className="text-3xl font-semibold tracking-tight">Session expired</h1>
				<p className="text-muted-foreground mt-4 text-sm">
					This authentication session has expired. Please log in again.
				</p>
			</div>
		);
	}

	const user = await getUserById(pending.userId);
	if (!user) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
				<title>Two-factor authentication - ARSN</title>
				<h1 className="text-3xl font-semibold tracking-tight">User not found</h1>
				<p className="text-muted-foreground mt-4 text-sm">This user no longer exists.</p>
			</div>
		);
	}

	return <EmailTwoFactorForm pendingAuthToken={pendingAuthToken} email={user.email} code={code} />;
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
