import { randomBytes } from "node:crypto";
import { inflateRawSync, deflateRawSync } from "node:zlib";
import { SignedXml } from "xml-crypto";
import { DOMParser } from "@xmldom/xmldom";
import type { SamlConfig, SamlMetadata, DecodedSamlRequest } from "./types";

export type {
	SamlBinding,
	SamlNameIdFormat,
	SamlConfig,
	SamlAuthnRequest,
	SamlAssertion,
	SamlResponse,
	SamlMetadata,
	DecodedSamlRequest,
} from "./types";

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function generateId(): string {
	return `_${randomBytes(16).toString("hex")}`;
}

function formatDate(date: Date): string {
	return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function getIssuer(entityId: string): string {
	return entityId;
}

function getPrivateKey(): string | undefined {
	return process.env.SAML_PRIVATE_KEY;
}

function getCertificate(): string | undefined {
	return process.env.SAML_CERTIFICATE;
}

export function generateAssertion(
	config: SamlConfig,
	user: {
		id: number;
		email: string;
		name?: string;
		givenName?: string | null;
		familyName?: string | null;
		displayName?: string | null;
		nickname?: string | null;
	},
	sessionIndex?: string,
): string {
	const now = new Date();
	const notBefore = new Date(now.getTime() - 300000);
	const notOnOrAfter = new Date(now.getTime() + 3600000);
	const assertionId = generateId();
	const issuer = getIssuer(config.entityId);
	const nameIdFormat = config.nameIdFormat ?? "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress";
	const nameId = user.email;
	const audience = config.audience ?? config.entityId;
	const authnInstant = formatDate(now);
	const sessionIdx = sessionIndex ?? generateId().substring(0, 32);

	const attrs = [
		{ name: "email", values: [user.email] },
		{ name: "sub", values: [String(user.id)] },
	];
	if (user.name) {
		attrs.push({ name: "name", values: [user.name] });
	}
	if (user.givenName) {
		attrs.push({ name: "givenName", values: [user.givenName] });
	}
	if (user.familyName) {
		attrs.push({ name: "sn", values: [user.familyName] });
		attrs.push({ name: "familyName", values: [user.familyName] });
	}
	if (user.displayName) {
		attrs.push({ name: "displayName", values: [user.displayName] });
	}
	if (user.nickname) {
		attrs.push({ name: "nickname", values: [user.nickname] });
	}

	let attrXml = "";
	for (const attr of attrs) {
		const vals = attr.values
			.map(
				(v) =>
					`<saml2:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">${escapeXml(v)}</saml2:AttributeValue>`,
			)
			.join("");
		attrXml += `
		<saml2:Attribute Name="${escapeXml(attr.name)}">${vals}
		</saml2:Attribute>`;
	}

	return `		<saml2:Assertion
			xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion"
			ID="${escapeXml(assertionId)}"
			IssueInstant="${formatDate(now)}"
			Version="2.0">
			<saml2:Issuer>${escapeXml(issuer)}</saml2:Issuer>
			<saml2:Subject>
				<saml2:NameID Format="${escapeXml(nameIdFormat)}">${escapeXml(nameId)}</saml2:NameID>
				<saml2:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
					<saml2:SubjectConfirmationData
						NotOnOrAfter="${formatDate(notOnOrAfter)}"
						Recipient="${escapeXml(config.acsUrl)}" />
				</saml2:SubjectConfirmation>
			</saml2:Subject>
			<saml2:Conditions
				NotBefore="${formatDate(notBefore)}"
				NotOnOrAfter="${formatDate(notOnOrAfter)}">
				<saml2:AudienceRestriction>
					<saml2:Audience>${escapeXml(audience)}</saml2:Audience>
				</saml2:AudienceRestriction>
			</saml2:Conditions>
			<saml2:AuthnStatement AuthnInstant="${authnInstant}" SessionIndex="${escapeXml(sessionIdx)}">
				<saml2:AuthnContext>
					<saml2:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml2:AuthnContextClassRef>
				</saml2:AuthnContext>
			</saml2:AuthnStatement>
			<saml2:AttributeStatement>${attrXml}
			</saml2:AttributeStatement>
		</saml2:Assertion>`;
}

export function signXml(xml: string, privateKey?: string): string {
	const key = privateKey ?? getPrivateKey();
	if (!key) {
		return xml;
	}

	const cert = getCertificate();
	const doc = new DOMParser().parseFromString(xml, "text/xml");
	const assertion = doc.getElementsByTagNameNS("urn:oasis:names:tc:SAML:2.0:assertion", "Assertion")[0];
	if (!assertion) {
		return xml;
	}

	const sig = new SignedXml();
	sig.privateKey = key;

	if (cert) {
		sig.publicCert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`;
	}

	sig.addReference({
		xpath: `//*[local-name(.)='Assertion']`,
		transforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/2001/10/xml-exc-c14n#"],
		digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
	});

	sig.computeSignature(xml);
	return sig.getSignedXml();
}

export function generateSamlResponse(
	config: SamlConfig,
	user: {
		id: number;
		email: string;
		name?: string;
		givenName?: string | null;
		familyName?: string | null;
		displayName?: string | null;
		nickname?: string | null;
	},
	sessionIndex?: string,
): string {
	const now = new Date();
	const responseId = generateId();
	const issuer = getIssuer(config.entityId);
	const assertionSigned = config.assertionSigned ?? true;

	let assertion = generateAssertion(config, user, sessionIndex);
	if (assertionSigned) {
		const privateKey = getPrivateKey();
		if (privateKey) {
			assertion = signXml(assertion, privateKey);
		}
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<saml2p:Response
	xmlns:saml2p="urn:oasis:names:tc:SAML:2.0:protocol"
	xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion"
	ID="${escapeXml(responseId)}"
	InResponseTo="${escapeXml(config.entityId)}"
	IssueInstant="${formatDate(now)}"
	Version="2.0"
	Destination="${escapeXml(config.acsUrl)}">
	<saml2:Issuer>${escapeXml(issuer)}</saml2:Issuer>
	<saml2p:Status>
		<saml2p:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success" />
	</saml2p:Status>
${assertion}
</saml2p:Response>`;
}

export function generateSamlLogoutResponse(config: SamlConfig): string {
	const now = new Date();
	const responseId = generateId();
	const issuer = getIssuer(config.entityId);

	return `<?xml version="1.0" encoding="UTF-8"?>
<saml2p:LogoutResponse
	xmlns:saml2p="urn:oasis:names:tc:SAML:2.0:protocol"
	xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion"
	ID="${escapeXml(responseId)}"
	IssueInstant="${formatDate(now)}"
	Version="2.0"
	Destination="${escapeXml(config.acsUrl)}">
	<saml2:Issuer>${escapeXml(issuer)}</saml2:Issuer>
	<saml2p:Status>
		<saml2p:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success" />
	</saml2p:Status>
</saml2p:LogoutResponse>`;
}

export function decodeSamlRequest(base64Encoded: string): string {
	const decoded = Buffer.from(base64Encoded, "base64");
	const inflated = inflateRawSync(decoded);
	return inflated.toString("utf-8");
}

export function encodeSamlResponse(xml: string): string {
	const deflated = deflateRawSync(Buffer.from(xml, "utf-8"));
	return deflated.toString("base64");
}

export function parseAuthnRequest(samlRequest: string): DecodedSamlRequest {
	const decoded = decodeSamlRequest(samlRequest);
	const result: DecodedSamlRequest = { samlRequest: decoded };

	const sigAlgMatch = decoded.match(/SigAlg=([^&]+)/);
	if (sigAlgMatch) {
		result.sigAlg = decodeURIComponent(sigAlgMatch[1]!);
	}

	const signatureMatch = decoded.match(/Signature=([^&]+)/);
	if (signatureMatch) {
		result.signature = decodeURIComponent(signatureMatch[1]!);
	}

	const relayStateMatch = decoded.match(/RelayState=([^&]+)/);
	if (relayStateMatch) {
		result.relayState = decodeURIComponent(relayStateMatch[1]!);
	}

	return result;
}

export function validateAuthnRequest(config: SamlConfig, samlRequest: string): boolean {
	const decoded = parseAuthnRequest(samlRequest);
	const xml = decoded.samlRequest;

	const acsUrlMatch = xml.match(/AssertionConsumerServiceURL=["']([^"']+)["']/);
	if (acsUrlMatch) {
		const acsUrl = acsUrlMatch[1]!;
		if (acsUrl !== config.acsUrl) {
			return false;
		}
	}

	const issuerMatch = xml.match(/<saml2:Issuer[^>]*>([^<]+)<\/saml2:Issuer>/);
	if (!issuerMatch) {
		return false;
	}
	const issuer = issuerMatch[1]!;
	if (issuer !== config.entityId) {
		return false;
	}

	const destMatch = xml.match(/Destination=["']([^"']+)["']/);
	if (destMatch) {
		const dest = destMatch[1]!;
		if (dest !== config.acsUrl && !dest.includes(config.acsUrl)) {
			return false;
		}
	}

	return true;
}

export function generateSamlMetadata(config: SamlMetadata): string {
	const entityId = escapeXml(config.entityId);
	const acsUrl = escapeXml(config.acsUrl);
	const binding = escapeXml(config.binding);
	const cert = config.certificate;
	const wantAuthnSigned = config.wantAuthnRequestsSigned ?? false;

	const certXml = cert
		? `			<ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
				<ds:X509Data>
					<ds:X509Certificate>${escapeXml(cert)}</ds:X509Certificate>
				</ds:X509Data>
			</ds:KeyInfo>`
		: "";

	return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
	<md:SPSSODescriptor
		protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"
		${wantAuthnSigned ? 'AuthnRequestsSigned="true"' : ""}>
${certXml}
		<md:AssertionConsumerService
			Binding="${binding}"
			Location="${acsUrl}"
			index="1" />
	</md:SPSSODescriptor>
</md:EntityDescriptor>`;
}
