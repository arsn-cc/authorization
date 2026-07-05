import { withSecurityHeaders } from "@/lib/http/response";
import { SESSION_COOKIE_NAME } from "@/lib/auth/utils";

export async function GET(_req: Request): Promise<Response> {
	return handleLogout();
}

export async function POST(_req: Request): Promise<Response> {
	return handleLogout();
}

function handleLogout(): Response {
	return withSecurityHeaders(
		new Response(null, {
			status: 302,
			headers: {
				Location: "https://arsn.cc",
				"Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
			},
		}),
	);
}
