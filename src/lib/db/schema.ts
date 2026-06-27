// ── Drizzle ORM schema for the authorization server ──────────────
// All tables use Postgres via drizzle-orm/pg-core.
// The `client` table is a single-table discriminator: every registered
// application, service, or identity source has one row, differentiated
// by the `type` column. Only the columns relevant to that type are used.

import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

// ── Permission ────────────────────────────────────────────────────
// A discrete action that a role can grant (e.g. "user:read").
const permission = pgTable("permission", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique(),
	description: text("description"),
});

// ── Role ──────────────────────────────────────────────────────────
// A named set of permissions assigned to users.
// `permissions` is a JSON array of permission names stored as text.
const role = pgTable("role", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique(),
	description: text("description"),
	permissions: text("permissions").notNull().default("[]"),
});

// ── User ──────────────────────────────────────────────────────────
// End-user account. Passwords are hashed with scrypt (salt:hash).
// `emailVerified` is set when the user confirms ownership.
const user = pgTable("user", {
	id: serial("id").primaryKey(),
	name: text("name"),
	email: text("email").notNull().unique(),
	emailVerified: timestamp("email_verified"),
	passwordHash: text("password_hash"),
	image: text("image"),
	roleId: integer("role_id").references(() => role.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Session ───────────────────────────────────────────────────────
// An active login session. `token` is the opaque bearer token.
// Geo/device metadata is captured for audit & display.
const session = pgTable("session", {
	id: serial("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => user.id),
	token: text("token").notNull().unique(),
	expires: timestamp("expires").notNull(),
	usedAt: timestamp("used_at"),
	userAgent: text("user_agent"),
	ip: text("ip"),
	location: text("location"),
	city: text("city"),
	country: text("country"),
	region: text("region"),
	timezone: text("timezone"),
	language: text("language"),
	deviceType: text("device_type"),
	os: text("os"),
	browser: text("browser"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Client ────────────────────────────────────────────────────────
// Every registered app, service, identity source, or protocol
// configuration lives in this one table, differentiated by `type`.
//
// Valid `type` values: oauth, oidc, saml, ldap, scim,
//                       cas, radius
const client = pgTable("client", {
	// ── Common ──────────────────────────────────────────────────
	id: serial("id").primaryKey(),
	clientId: text("client_id").notNull().unique(),
	type: text("type").notNull(),
	clientSecret: text("client_secret"),
	name: text("name").notNull(),
	redirectUris: text("redirect_uris"),
	grants: text("grants"),
	scopes: text("scopes").notNull().default("openid profile email"),
	logo: text("logo"),
	website: text("website"),
	requireConsent: integer("require_consent").notNull().default(1),

	// ── OAuth 2.1 & OpenID Connect (type = oauth / oidc) ──────
	// OAuth 2.1 mandates PKCE, exact redirect URIs, refresh token
	// rotation, and sender-constrained tokens. OIDC extends OAuth
	// with an identity layer for id_tokens and UserInfo.

	// PKCE & grant restrictions
	pkceRequired: integer("pkce_required"),
	pkceChallengeMethod: text("pkce_challenge_method"),
	requirePushedAuthorizationRequests: integer("require_pushed_authorization_requests"),
	requireSignedRequestObject: integer("require_signed_request_object"),
	requestObjectSigningAlg: text("request_object_signing_alg"),
	requestUris: text("request_uris"),
	authorizationDataTypes: text("authorization_data_types"),

	// Token lifetimes & rotation
	accessTokenTtl: integer("access_token_ttl"),
	refreshTokenTtl: integer("refresh_token_ttl"),
	refreshTokenRotationEnabled: integer("refresh_token_rotation_enabled"),
	reuseRefreshTokens: integer("reuse_refresh_tokens"),
	idTokenTtl: integer("id_token_ttl"),

	// Token endpoint auth
	tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
	tokenEndpointAuthSigningAlg: text("token_endpoint_auth_signing_alg"),

	// Sender-constrained tokens (DPoP / mTLS)
	dpopBound: integer("dpop_bound"),
	dpopSigningAlg: text("dpop_signing_alg"),
	mtlsBound: integer("mtls_bound"),
	mtlsCertificateFingerprint: text("mtls_certificate_fingerprint"),

	// OIDC-specific
	idTokenSignedResponseAlg: text("id_token_signed_response_alg"),
	userinfoSignedResponseAlg: text("userinfo_signed_response_alg"),
	subjectType: text("subject_type"),
	sectorIdentifierUri: text("sector_identifier_uri"),

	// Registration metadata
	clientIdIssuedAt: timestamp("client_id_issued_at"),
	clientSecretExpiresAt: timestamp("client_secret_expires_at"),

	// ── SAML 2.0 (type = saml) ─────────────────────────────────
	// Enterprise SSO via SAML2 HTTP-POST / Redirect bindings.
	entityId: text("entity_id"),
	acsUrl: text("acs_url"),
	audience: text("audience"),
	samlCertificate: text("saml_certificate"),
	samlBinding: text("saml_binding"),
	nameIdFormat: text("name_id_format"),
	assertionSigned: integer("assertion_signed"),
	authnSigned: integer("authn_signed"),

	// ── LDAP (type = ldap) ─────────────────────────────────────
	// This auth server acts as an LDAP directory server, exposing
	// users and groups via the LDAP protocol for legacy integrations
	// (e.g. VPN appliances, mail servers, NAS devices).
	// Configure a single `ldap` client to define the directory shape.
	ldapDomain: text("ldap_domain"),
	ldapPort: integer("ldap_port"),
	ldapsEnabled: integer("ldaps_enabled"),
	ldapTlsCert: text("ldap_tls_cert"),
	ldapTlsKey: text("ldap_tls_key"),
	ldapAdminDn: text("ldap_admin_dn"),
	ldapAdminPassword: text("ldap_admin_password"),
	ldapUserObjectClass: text("ldap_user_object_class"),
	ldapGroupObjectClass: text("ldap_group_object_class"),

	// ── SCIM (type = scim) ─────────────────────────────────────
	// System for Cross-domain Identity Management — used by
	// enterprise IdPs to provision users/groups via REST API.
	scimBaseUrl: text("scim_base_url"),
	scimBearerToken: text("scim_bearer_token"),
	scimSupportedAttributes: text("scim_supported_attributes"),

	// ── CAS (type = cas) ───────────────────────────────────────
	// Central Authentication Service — legacy SSO still used in
	// universities and enterprise portals.
	casLoginUrl: text("cas_login_url"),
	casLogoutUrl: text("cas_logout_url"),
	casServiceTicketTtl: integer("cas_service_ticket_ttl"),

	// ── RADIUS (type = radius) ─────────────────────────────────
	// Remote Authentication Dial-In User Service — network access
	// authentication for VPN, WiFi, and NAS devices.
	radiusSecret: text("radius_secret"),
	radiusAuthProtocol: text("radius_auth_protocol"),
	radiusServerIp: text("radius_server_ip"),
	radiusAuthPort: integer("radius_auth_port"),
	radiusAcctPort: integer("radius_acct_port"),
	radiusNasIdentifier: text("radius_nas_identifier"),

	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const schema = { user, session, client, role, permission };
