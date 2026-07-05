import { withSecurityHeaders } from "@/lib/http/response";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import {
	decodeSamlRequest,
	validateAuthnRequest,
	verifyAuthnRequestSignature,
	generateSamlResponse,
	encodeSamlResponse,
} from "@/lib/auth/saml";
import { getSession } from "@/lib/auth";
import { usernameToEmail } from "@/lib/auth/utils";
import { parseCookie, SESSION_COOKIE_NAME } from "@/lib/auth/utils";

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
		return withSecurityHeaders(Response.json({ error: "missing_saml_request" }, { status: 400 }));
	}

	const entityId = url.searchParams.get("entity_id");
	if (!entityId) {
		return withSecurityHeaders(Response.json({ error: "missing_entity_id" }, { status: 400 }));
	}

	const db = await getDb();
	const [client] = await db.select().from(schema.client).where(eq(schema.client.clientId, entityId));

	if (!client) {
		return withSecurityHeaders(Response.json({ error: "unknown_service_provider" }, { status: 400 }));
	}

	const decoded = decodeSamlRequest(samlRequestB64);

	const config = {
		entityId: client.entityId ?? entityId,
		acsUrl: client.acsUrl ?? "",
		certificate: client.samlCertificate ?? "",
		privateKey: "",
	};

	const validationResult = validateAuthnRequest(config, decoded);
	if (!validationResult.valid) {
		return withSecurityHeaders(Response.json({ error: "invalid_authn_request" }, { status: 400 }));
	}

	const sigAlgParam = url.searchParams.get("SigAlg");
	const signatureParam = url.searchParams.get("Signature");
	const requireSignature = Boolean(client.samlCertificate);
	if (requireSignature && (!sigAlgParam || !signatureParam)) {
		return withSecurityHeaders(Response.json({ error: "missing_authn_request_signature" }, { status: 400 }));
	}
	if (sigAlgParam && signatureParam) {
		if (
			!verifyAuthnRequestSignature(
				samlRequestB64,
				relayState ?? null,
				sigAlgParam,
				signatureParam,
				client.samlCertificate ?? "",
			)
		) {
			return withSecurityHeaders(Response.json({ error: "invalid_authn_request_signature" }, { status: 400 }));
		}
	}

	const cookie = req.headers.get("cookie") ?? "";
	const token = parseCookie(cookie, SESSION_COOKIE_NAME);
	if (!token) {
		const loginUrl = new URL("/login", url.origin);
		loginUrl.searchParams.set("redirect", url.pathname + url.search);
		return withSecurityHeaders(new Response(null, { status: 302, headers: { Location: loginUrl.toString() } }));
	}

	const session = await getSession(token);
	if (!session.success || !session.data) {
		const loginUrl = new URL("/login", url.origin);
		loginUrl.searchParams.set("redirect", url.pathname + url.search);
		return withSecurityHeaders(new Response(null, { status: 302, headers: { Location: loginUrl.toString() } }));
	}

	const { user } = session.data;
	const samlResponse = generateSamlResponse(
		config,
		{
			id: user.id,
			email: usernameToEmail(user.username),
			...(user.name ? { name: user.name } : {}),
			...(user.displayName ? { displayName: user.displayName } : {}),
		},
		usernameToEmail(user.username),
		validationResult.requestId,
	);

	const samlResponseB64 = encodeSamlResponse(samlResponse);
	const escapedAcsUrl = config.acsUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
	const formHtml = [
		"<!DOCTYPE html><html><body onload='document.forms[0].submit()'>",
		`<form method='POST' action='${escapedAcsUrl}'>`,
		`<input type='hidden' name='SAMLResponse' value='${samlResponseB64}'/>`,
		relayState ? `<input type='hidden' name='RelayState' value='${relayState}'/>` : "",
		"</form></body></html>",
	].join("");

	return withSecurityHeaders(
		new Response(formHtml, {
			status: 200,
			headers: { "content-type": "text/html; charset=utf-8" },
		}),
	);
}
