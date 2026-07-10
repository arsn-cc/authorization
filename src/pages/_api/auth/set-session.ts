import { withSecurityHeaders } from "@/lib/http/response";
import { SESSION_COOKIE_NAME } from "@/lib/auth/utils";
import { parseJsonSafe } from "@/lib/http/validate";
import { setSessionSchema } from "@/lib/schemas/auth";
import { getSession } from "@/lib/auth";

export async function POST(req: Request): Promise<Response> {
	const body = await parseJsonSafe(req, setSessionSchema);
	if (body instanceof Response) {
		return body;
	}

	// Fail closed: only mint the session cookie for a token that maps to a
	// currently-valid session. This prevents the endpoint from being used to
	// set an arbitrary/forged cookie.
	const session = await getSession(body.token);
	if (!session.success || !session.data) {
		return withSecurityHeaders(Response.json({ error: "invalid_token" }, { status: 401 }));
	}

	const maxAge = body.expires
		? Math.max(0, Math.floor((new Date(body.expires).getTime() - Date.now()) / 1000))
		: 604800;

	return withSecurityHeaders(
		new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": `${SESSION_COOKIE_NAME}=${encodeURIComponent(body.token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`,
			},
		}),
	);
}
