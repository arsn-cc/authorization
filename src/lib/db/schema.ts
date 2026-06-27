import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

const permission = pgTable("permission", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique(),
	description: text("description"),
});

const role = pgTable("role", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique(),
	description: text("description"),
	permissions: text("permissions").notNull().default("[]"),
});

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

const client = pgTable("client", {
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
	entityId: text("entity_id"),
	acsUrl: text("acs_url"),
	audience: text("audience"),
	samlCertificate: text("saml_certificate"),
	samlBinding: text("saml_binding"),
	nameIdFormat: text("name_id_format"),
	assertionSigned: integer("assertion_signed"),
	authnSigned: integer("authn_signed"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const schema = { user, session, client, role, permission };
