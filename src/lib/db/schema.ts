export function createSchema<TTable extends (...args: any[]) => any>(builders: {
	table: TTable;
	id: (name: string) => { primaryKey(config?: any): any };
	text: (name: string) => { notNull(): any; unique(): any };
	timestamp: (name: string) => { notNull(): any; defaultNow(): any };
}): { users: ReturnType<TTable> } {
	const users = builders.table("users", {
		id: builders.id("id").primaryKey(),
		name: builders.text("name").notNull(),
		email: builders.text("email").notNull().unique(),
		createdAt: builders.timestamp("created_at").defaultNow().notNull(),
	});

	return { users };
}
