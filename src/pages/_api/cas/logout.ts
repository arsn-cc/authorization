import { createLogoutUrl } from "@/lib/cas";
import { logoutUser } from "@/lib/auth";
import { parseCookie, SESSION_COOKIE_NAME } from "@/lib/auth/utils";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const service = url.searchParams.get("service") ?? undefined;
	const redirectUrl = createLogoutUrl(service);

	const cookie = req.headers.get("cookie") ?? "";
	const token = parseCookie(cookie, SESSION_COOKIE_NAME);
	if (token) {
		await logoutUser(token);
	}

	return new Response(null, {
		status: 302,
		headers: {
			Location: redirectUrl,
			"Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
		},
	});
}
