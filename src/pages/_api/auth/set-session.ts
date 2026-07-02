import { SESSION_COOKIE_NAME } from "@/lib/auth/utils";

export async function POST(req: Request): Promise<Response> {
	const body = (await req.json()) as { token?: string; expires?: string };
	if (!body.token) {
		return Response.json({ error: "missing_token" }, { status: 400 });
	}

	const maxAge = body.expires
		? Math.max(0, Math.floor((new Date(body.expires).getTime() - Date.now()) / 1000))
		: 604800;

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Set-Cookie": `${SESSION_COOKIE_NAME}=${encodeURIComponent(body.token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`,
		},
	});
}
