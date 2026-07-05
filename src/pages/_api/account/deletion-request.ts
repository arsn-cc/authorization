import { withSecurityHeaders } from "@/lib/http/response";
import { getAccountUser, unauthorized } from "@/lib/auth/account-auth";
import { requestAccountDeletion } from "@/lib/auth";
import { usernameToEmail } from "@/lib/auth/utils";

export async function POST(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const result = await requestAccountDeletion(
		authed.userId,
		usernameToEmail(authed.user.username),
		authed.user.name ?? authed.user.username,
	);

	if (!result.success) {
		return withSecurityHeaders(Response.json({ error: result.error.code }, { status: 400 }));
	}

	return withSecurityHeaders(Response.json({ message: "deletion_email_sent" }));
}
