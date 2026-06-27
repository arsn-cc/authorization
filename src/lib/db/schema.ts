export function createSchema<TTable extends (...args: any[]) => any>(builders: {
	table: TTable;
	id: (name: string) => { primaryKey(config?: any): any };
	integer: (name: string) => { notNull(): any; references(fn: () => any): any; default(value: number): any };
	text: (name: string) => { notNull(): any; unique(): any; default(value: string): any };
	timestamp: (name: string) => { notNull(): any; defaultNow(): any };
}): {
	user: ReturnType<TTable>;
	session: ReturnType<TTable>;
	client: ReturnType<TTable>;
	role: ReturnType<TTable>;
	permission: ReturnType<TTable>;
} {
	const user = builders.table("user", {
		id: builders.id("id").primaryKey(),
		name: builders.text("name"),
		email: builders.text("email").notNull().unique(),
		emailVerified: builders.timestamp("email_verified"),
		passwordHash: builders.text("password_hash"),
		image: builders.text("image"),
		roleId: builders.integer("role_id").references(() => role.id),
		createdAt: builders.timestamp("created_at").notNull().defaultNow(),
		updatedAt: builders.timestamp("updated_at").notNull().defaultNow(),
	});

	const session = builders.table("session", {
		id: builders.id("id").primaryKey(),
		userId: builders
			.integer("user_id")
			.notNull()
			.references(() => user.id),
		token: builders.text("token").notNull().unique(),
		expires: builders.timestamp("expires").notNull(),
		usedAt: builders.timestamp("used_at"),
		userAgent: builders.text("user_agent"),
		ip: builders.text("ip"),
		location: builders.text("location"),
		city: builders.text("city"),
		country: builders.text("country"),
		region: builders.text("region"),
		timezone: builders.text("timezone"),
		language: builders.text("language"),
		deviceType: builders.text("device_type"),
		os: builders.text("os"),
		browser: builders.text("browser"),
		createdAt: builders.timestamp("created_at").notNull().defaultNow(),
	});

	const client = builders.table("client", {
		id: builders.id("id").primaryKey(),
		clientId: builders.text("client_id").notNull().unique(),
		type: builders.text("type").notNull(),
		clientSecret: builders.text("client_secret"),
		name: builders.text("name").notNull(),
		redirectUris: builders.text("redirect_uris"),
		grants: builders.text("grants"),
		scopes: builders.text("scopes").notNull().default("openid profile email"),
		logo: builders.text("logo"),
		website: builders.text("website"),
		requireConsent: builders.integer("require_consent").notNull().default(1),
		entityId: builders.text("entity_id"),
		acsUrl: builders.text("acs_url"),
		audience: builders.text("audience"),
		samlCertificate: builders.text("saml_certificate"),
		samlBinding: builders.text("saml_binding"),
		nameIdFormat: builders.text("name_id_format"),
		assertionSigned: builders.integer("assertion_signed"),
		authnSigned: builders.integer("authn_signed"),
		createdAt: builders.timestamp("created_at").notNull().defaultNow(),
		updatedAt: builders.timestamp("updated_at").notNull().defaultNow(),
	});

	const role = builders.table("role", {
		id: builders.id("id").primaryKey(),
		name: builders.text("name").notNull().unique(),
		description: builders.text("description"),
		permissions: builders.text("permissions").notNull().default("[]"),
	});

	const permission = builders.table("permission", {
		id: builders.id("id").primaryKey(),
		name: builders.text("name").notNull().unique(),
		description: builders.text("description"),
	});

	return { user, session, client, role, permission };
}
