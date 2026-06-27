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
} {
	const user = builders.table("user", {
		id: builders.id("id").primaryKey(),
		name: builders.text("name"),
		email: builders.text("email").notNull().unique(),
		emailVerified: builders.timestamp("email_verified"),
		passwordHash: builders.text("password_hash"),
		image: builders.text("image"),
		createdAt: builders.timestamp("created_at").notNull().defaultNow(),
		updatedAt: builders.timestamp("updated_at").notNull().defaultNow(),
	});

	const session = builders.table("session", {
		id: builders.id("id").primaryKey(),
		sessionToken: builders.text("session_token").notNull().unique(),
		userId: builders
			.integer("user_id")
			.notNull()
			.references(() => user.id),
		expires: builders.timestamp("expires").notNull(),
		createdAt: builders.timestamp("created_at").notNull().defaultNow(),
	});

	const client = builders.table("client", {
		id: builders.id("id").primaryKey(),
		clientId: builders.text("client_id").notNull().unique(),
		clientSecret: builders.text("client_secret"),
		name: builders.text("name").notNull(),
		redirectUris: builders.text("redirect_uris").notNull().default("[]"),
		grants: builders.text("grants").notNull().default('["authorization_code"]'),
		scopes: builders.text("scopes").notNull().default("openid profile email"),
		logo: builders.text("logo"),
		website: builders.text("website"),
		requireConsent: builders.integer("require_consent").notNull().default(1),
		createdAt: builders.timestamp("created_at").notNull().defaultNow(),
		updatedAt: builders.timestamp("updated_at").notNull().defaultNow(),
	});

	return { user, session, client };
}
