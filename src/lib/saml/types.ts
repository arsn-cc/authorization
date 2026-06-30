export type SamlBinding =
	| "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
	| "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST";

export type SamlNameIdFormat =
	| "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
	| "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"
	| "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent"
	| "urn:oasis:names:tc:SAML:2.0:nameid-format:transient";

export interface SamlConfig {
	entityId: string;
	acsUrl: string;
	audience?: string;
	certificate?: string;
	binding?: SamlBinding;
	nameIdFormat?: SamlNameIdFormat;
	assertionSigned?: boolean;
	authnSigned?: boolean;
}

export interface SamlAuthnRequest {
	id: string;
	issueInstant: Date;
	destination: string;
	issuer: string;
	assertionConsumerServiceUrl: string;
	protocolBinding?: SamlBinding;
	forceAuthn?: boolean;
	isPassive?: boolean;
	nameIdPolicy?: {
		format?: SamlNameIdFormat;
		allowCreate?: boolean;
	};
	relayState?: string;
}

export interface SamlAssertion {
	id: string;
	issueInstant: Date;
	issuer: string;
	subject: {
		nameId: string;
		nameIdFormat: SamlNameIdFormat;
		nameQualifier?: string;
		spNameQualifier?: string;
	};
	conditions: {
		notBefore: Date;
		notOnOrAfter: Date;
		audience?: string[];
	};
	authnStatement?: {
		authnInstant: Date;
		sessionIndex?: string;
		authnContextClassRef?: string;
	};
	attributeStatement?: Array<{
		name: string;
		values: string[];
		friendlyName?: string;
		nameFormat?: string;
	}>;
}

export interface SamlResponse {
	id: string;
	issueInstant: Date;
	destination: string;
	issuer: string;
	status: "Success" | "Requester" | "Responder" | "VersionMismatch";
	statusMessage?: string;
	assertion?: SamlAssertion;
	relayState?: string;
}

export interface SamlMetadata {
	entityId: string;
	acsUrl: string;
	binding: SamlBinding;
	nameIdFormat?: SamlNameIdFormat;
	certificate?: string;
	wantAuthnRequestsSigned?: boolean;
}

export interface DecodedSamlRequest {
	samlRequest: string;
	requestId?: string;
	relayState?: string;
	sigAlg?: string;
	signature?: string;
}
