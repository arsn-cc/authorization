import { withSecurityHeaders } from "@/lib/http/response";
import { searchUsers, getDefaultServerConfig } from "@/lib/ldap";
import { getAccountUser } from "@/pages/_api/account/auth";

export async function POST(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return withSecurityHeaders(Response.json({ error: "unauthorized" }, { status: 401 }));
	}

	const body = (await req.json()) as Record<string, unknown>;
	const _baseDn = (body.base_dn as string) ?? "";
	const _filter = (body.filter as string) ?? "";

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
