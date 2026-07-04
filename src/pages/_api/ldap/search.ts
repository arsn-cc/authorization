import { withSecurityHeaders } from "@/lib/http/response";
import { searchUsers, getDefaultServerConfig } from "@/lib/ldap";
import { getAccountUser } from "@/lib/auth/account-auth";

export async function POST(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return withSecurityHeaders(Response.json({ error: "unauthorized" }, { status: 401 }));
	}

	const config = getDefaultServerConfig();

	try {
		const entries = await searchUsers(config.domain);

		return withSecurityHeaders(
			Response.json({
				totalResults: entries.length,
				entries,
			}),
		);
	} catch (e) {
		return withSecurityHeaders(
			Response.json({ error: e instanceof Error ? e.message : "search_failed" }, { status: 500 }),
		);
	}
}
