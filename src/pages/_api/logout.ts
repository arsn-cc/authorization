import { logoutUser } from "@/lib/auth";

function parseCookie(cookie: string, name: string): string | null {
	const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]!) : null;
}

export async function GET(req: Request): Promise<Response> {
	const cookie = req.headers.get("cookie") || "";
	const token = parseCookie(cookie, "session_token");

	if (token) {
		await logoutUser(token);
	}

	return new Response(null, {
		status: 302,
		headers: {
			Location: "https://arsn.cc",
			"Set-Cookie":
				"session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
		},
	});
}
