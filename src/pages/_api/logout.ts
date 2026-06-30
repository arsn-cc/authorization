import { logoutUser } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth/utils";

function parseCookie(cookie: string, name: string): string | null {
	const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]!) : null;
}

export async function GET(req: Request): Promise<Response> {
	const cookie = req.headers.get("cookie") || "";
	const token = parseCookie(cookie, SESSION_COOKIE_NAME);

	if (token) {
		await logoutUser(token);
	}

	return new Response(null, {
		status: 302,
		headers: {
			Location: "https://arsn.cc",
			"Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
		},
	});
}
