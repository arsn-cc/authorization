import { withSecurityHeaders } from "@/lib/http/response";
import { verifyLdapUserBind } from "@/lib/ldap";
import { parseJsonSafe } from "@/lib/http/validate";
import { ldapBindSchema } from "@/lib/schemas/auth";

export async function POST(req: Request): Promise<Response> {
	const body = await parseJsonSafe(req, ldapBindSchema);
	if (body instanceof Response) {
		return body;
	}
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
