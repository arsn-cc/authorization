import { withSecurityHeaders } from "@/lib/http/response";
import { authenticateUser, RADIUS_CODE, type RadiusConfig } from "@/lib/radius";
import { getAccountUser } from "@/pages/_api/account/auth";
import { parseJsonSafe } from "@/lib/http/validate";
import { radiusAuthSchema } from "@/lib/schemas/auth";

export async function POST(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return withSecurityHeaders(Response.json({ error: "unauthorized" }, { status: 401 }));
	}

	const body = await parseJsonSafe(req, radiusAuthSchema);
	if (body instanceof Response) {
		return body;
	}

	if (!body.username || !body.password) {
		return withSecurityHeaders(Response.json({ error: "missing_credentials" }, { status: 400 }));
	}

	const config: RadiusConfig = {
		secret: body.secret ?? process.env.RADIUS_SECRET ?? "",
		authPort: Number(process.env.RADIUS_AUTH_PORT) || 1812,
		acctPort: Number(process.env.RADIUS_ACCT_PORT) || 1813,
	};

	try {
		const result = await authenticateUser(
			{
				code: RADIUS_CODE.ACCESS_REQUEST,
				identifier: 1,
				authenticator: Buffer.alloc(16),
				attributes: [
					{ type: 1, value: Buffer.from(body.username) },
					{ type: 2, value: Buffer.from(body.password) },
					{ type: 32, value: Buffer.from(body.nasIdentifier ?? "") },
				],
			},
			config,
		);

		return withSecurityHeaders(
			Response.json({
				status: result.success ? "Access-Accept" : "Access-Reject",
			}),
		);
	} catch (e) {
		return withSecurityHeaders(
			Response.json({ error: e instanceof Error ? e.message : "authentication_failed" }, { status: 500 }),
		);
	}
}
