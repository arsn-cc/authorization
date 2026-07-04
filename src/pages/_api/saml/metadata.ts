import { withSecurityHeaders } from "@/lib/http/response";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { generateSamlMetadata } from "@/lib/saml";
import { z } from "zod";

const bindingSchema = z.enum([
	"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
	"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
]);

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const entityId = url.searchParams.get("entity_id");

	if (!entityId) {
		return withSecurityHeaders(Response.json({ error: "missing_entity_id" }, { status: 400 }));
	}

	const db = await getDb();
	const [client] = await db.select().from(schema.client).where(eq(schema.client.clientId, entityId));

	if (!client) {
		return withSecurityHeaders(Response.json({ error: "unknown_service_provider" }, { status: 400 }));
	}

	const binding = bindingSchema.parse(client.samlBinding ?? "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST");

	const config = {
		entityId: client.entityId ?? entityId,
		acsUrl: client.acsUrl ?? "",
		certificate: client.samlCertificate ?? "",
		binding,
		privateKey: "",
	};

	const metadata = generateSamlMetadata(config);

	return withSecurityHeaders(
		new Response(metadata, {
			status: 200,
			headers: { "content-type": "application/xml; charset=utf-8" },
		}),
	);
}
