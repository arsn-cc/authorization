import { withSecurityHeaders } from "@/lib/http/response";
import { logoutUser } from "@/lib/auth";
import { parseCookie, SESSION_COOKIE_NAME } from "@/lib/auth/utils";

export async function GET(req: Request): Promise<Response> {
	const cookie = req.headers.get("cookie") || "";
	const token = parseCookie(cookie, SESSION_COOKIE_NAME);

	if (token) {
		await logoutUser(token);
	}

	return withSecurityHeaders(
		new Response(null, {
			status: 302,
			headers: {
				Location: "https://arsn.cc",
				"Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
			},
		}),
	);
}
