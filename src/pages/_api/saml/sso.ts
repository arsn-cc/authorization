import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import {
	decodeSamlRequest,
	parseAuthnRequest,
	validateAuthnRequest,
	verifyAuthnRequestSignature,
	generateSamlResponse,
} from "@/lib/saml";
import { getSession } from "@/lib/auth";

function parseCookie(cookie: string, name: string): string | null {
	const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]!) : null;
}

export async function GET(req: Request): Promise<Response> {
	return handleSso(req);
}

export async function POST(req: Request): Promise<Response> {
	return handleSso(req);
}

async function handleSso(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const samlRequestB64 = url.searchParams.get("SAMLRequest") ?? null;
	const relayState = url.searchParams.get("RelayState") ?? undefined;

	if (!samlRequestB64) {
		return Response.json({ error: "missing_saml_request" }, { status: 400 });
	}

	const entityId = url.searchParams.get("entity_id");
	if (!entityId) {
		return Response.json({ error: "missing_entity_id" }, { status: 400 });
	}

	const db = await getDb();
	const [client] = await db.select().from(schema.client).where(eq(schema.client.clientId, entityId));

	if (!client) {
		return Response.json({ error: "unknown_service_provider" }, { status: 400 });
	}

	const decoded = decodeSamlRequest(samlRequestB64);
	let parsed;
	try {
		parsed = parseAuthnRequest(decoded);
	} catch {
		return Response.json({ error: "invalid_saml_request" }, { status: 400 });
	}

	const config = {
		entityId: client.entityId ?? entityId,
		acsUrl: client.acsUrl ?? "",
		certificate: client.samlCertificate ?? "",
		privateKey: "",
	};

	if (!validateAuthnRequest(config, decoded)) {
		return Response.json({ error: "invalid_authn_request" }, { status: 400 });
	}

	if (parsed.signature && parsed.sigAlg) {
		const relayStateParam = url.searchParams.get("RelayState");
		if (
			!verifyAuthnRequestSignature(
				samlRequestB64,
				relayStateParam,
				parsed.sigAlg,
				parsed.signature,
				client.samlCertificate ?? "",
			)
		) {
			return Response.json({ error: "invalid_authn_request_signature" }, { status: 400 });
		}
	}

	const cookie = req.headers.get("cookie") ?? "";
	const token = parseCookie(cookie, "session_token");
	if (!token) {
		const loginUrl = new URL("/login", url.origin);
		loginUrl.searchParams.set("redirect", url.pathname + url.search);
		return new Response(null, { status: 302, headers: { Location: loginUrl.toString() } });
	}

	const session = await getSession(token);
	if (!session.success || !session.data) {
		const loginUrl = new URL("/login", url.origin);
		loginUrl.searchParams.set("redirect", url.pathname + url.search);
		return new Response(null, { status: 302, headers: { Location: loginUrl.toString() } });
	}

	const { user } = session.data;
	const samlResponse = generateSamlResponse(
		config,
		{
			id: user.id,
			email: user.email,
			...(user.name ? { name: user.name } : {}),
			...(user.givenName ? { givenName: user.givenName } : {}),
			...(user.familyName ? { familyName: user.familyName } : {}),
			...(user.displayName ? { displayName: user.displayName } : {}),
			...(user.nickname ? { nickname: user.nickname } : {}),
		},
		user.email,
		parsed.requestId,
	);

	const formHtml = [
		"<!DOCTYPE html><html><body onload='document.forms[0].submit()'>",
		`<form method='POST' action='${config.acsUrl}'>`,
		`<input type='hidden' name='SAMLResponse' value='${encodeURIComponent(samlResponse)}'/>`,
		relayState ? `<input type='hidden' name='RelayState' value='${encodeURIComponent(relayState)}'/>` : "",
		"</form></body></html>",
	].join("");

	return new Response(formHtml, {
		status: 200,
		headers: { "content-type": "text/html; charset=utf-8" },
	});
}
