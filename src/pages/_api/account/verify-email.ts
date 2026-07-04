import { withSecurityHeaders } from "@/lib/http/response";
import { verifyEmail } from "@/lib/auth";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const token = url.searchParams.get("token");

	if (!token) {
		return withSecurityHeaders(Response.json({ error: "missing_token" }, { status: 400 }));
	}

	const result = await verifyEmail(token);
	if (!result.success) {
		return withSecurityHeaders(Response.json({ error: result.error.code }, { status: 400 }));
	}

	return withSecurityHeaders(Response.json({ message: "email_verified" }));
}
