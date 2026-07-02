import { withSecurityHeaders } from "@/lib/http/response";
import { verifyLdapUserBind } from "@/lib/ldap";

export async function POST(req: Request): Promise<Response> {
	const body = (await req.json()) as { username?: string; password?: string; dn?: string };
	const username = body.username ?? body.dn;
	const password = body.password;

	if (!username || !password) {
		return withSecurityHeaders(Response.json({ error: "missing_credentials" }, { status: 400 }));
	}

	const valid = await verifyLdapUserBind(username, password);
	if (!valid) {
		return withSecurityHeaders(Response.json({ error: "invalid_credentials" }, { status: 401 }));
	}

	return withSecurityHeaders(Response.json({ status: "success" }));
}
