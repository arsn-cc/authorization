import { withSecurityHeaders } from "@/lib/http/response";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { createLoginUrl } from "@/lib/cas";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const service = url.searchParams.get("service");

	if (!service) {
		return withSecurityHeaders(Response.json({ error: "missing_service_parameter" }, { status: 400 }));
	}

	try {
		const _parsed = new URL(service);
		void _parsed;
	} catch {
		return withSecurityHeaders(Response.json({ error: "invalid_service_parameter" }, { status: 400 }));
	}

	const db = await getDb();
	const clients = await db
		.select({ redirectUris: schema.client.redirectUris })
		.from(schema.client)
		.where(eq(schema.client.type, "cas"));

	const allowedUris = clients.flatMap((c) => (c.redirectUris ?? "").split(",").map((u) => u.trim())).filter(Boolean);

	if (allowedUris.length > 0 && !allowedUris.includes(service)) {
		return withSecurityHeaders(Response.json({ error: "unauthorized_service" }, { status: 400 }));
	}

	const loginUrl = createLoginUrl({ service: encodeURIComponent(service) });
	return withSecurityHeaders(new Response(null, { status: 302, headers: { Location: loginUrl } }));
}
