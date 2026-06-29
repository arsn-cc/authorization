import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { generateSamlLogoutResponse } from "@/lib/saml";

export async function GET(req: Request): Promise<Response> {
	return handleLogout(req);
}

export async function POST(req: Request): Promise<Response> {
	return handleLogout(req);
}

async function handleLogout(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const entityId = url.searchParams.get("entity_id");
	const relayState = url.searchParams.get("RelayState") ?? undefined;

	if (entityId) {
		const db = await getDb();
		const [client] = await db.select().from(schema.client).where(eq(schema.client.clientId, entityId));

		if (client) {
			const config = {
				entityId: client.entityId ?? entityId,
				acsUrl: client.acsUrl ?? "",
				certificate: client.samlCertificate ?? "",
				privateKey: "",
			};

			const logoutResponse = generateSamlLogoutResponse(config);

			if (client.casLogoutUrl) {
				const formHtml = [
					"<!DOCTYPE html><html><body onload='document.forms[0].submit()'>",
					`<form method='POST' action='${client.casLogoutUrl}'>`,
					`<input type='hidden' name='SAMLResponse' value='${encodeURIComponent(logoutResponse)}'/>`,
					relayState ? `<input type='hidden' name='RelayState' value='${encodeURIComponent(relayState)}'/>` : "",
					"</form></body></html>",
				].join("");
				return new Response(formHtml, {
					status: 200,
					headers: { "content-type": "text/html; charset=utf-8" },
				});
			}
		}
	}

	return new Response(null, {
		status: 302,
		headers: {
			Location: "https://arsn.cc",
			"Set-Cookie": "session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
		},
	});
}
