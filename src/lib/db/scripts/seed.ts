import { eq } from "drizzle-orm";
import { getDb } from "../index";
import { schema } from "../schema";

const PERMISSIONS = [
	{ name: "user:read", description: "View users" },
	{ name: "user:write", description: "Create and update users" },
	{ name: "user:delete", description: "Delete users" },
	{ name: "role:read", description: "View roles" },
	{ name: "role:write", description: "Create and update roles" },
	{ name: "role:delete", description: "Delete roles" },
	{ name: "client:read", description: "View clients" },
	{ name: "client:write", description: "Create and update clients" },
	{ name: "client:delete", description: "Delete clients" },
	{ name: "session:read", description: "View sessions" },
	{ name: "session:delete", description: "Delete sessions" },
	{ name: "permission:read", description: "View permissions" },
] as const;

const ROLES = [
	{
		name: "admin",
		description: "Full system access",
		permissions: PERMISSIONS.map((p) => p.name),
	},
	{
		name: "manager",
		description: "Can manage users, clients, and roles",
		permissions: [
			"user:read",
			"user:write",
			"role:read",
			"client:read",
			"client:write",
			"session:read",
			"session:delete",
			"permission:read",
		],
	},
	{
		name: "user",
		description: "Standard user with self-service access",
		permissions: ["user:read", "session:read", "permission:read"],
	},
] as const;

async function seed() {
	const db = await getDb();

	console.log("Seeding permissions...");
	for (const perm of PERMISSIONS) {
		const existing = await db.select().from(schema.permission).where(eq(schema.permission.name, perm.name));
		if (existing.length === 0) {
			await db.insert(schema.permission).values(perm);
			console.log(`  + ${perm.name}`);
		} else {
			console.log(`  ~ ${perm.name} (exists)`);
		}
	}

	console.log("\nSeeding roles...");
	for (const role of ROLES) {
		const existing = await db.select().from(schema.role).where(eq(schema.role.name, role.name));
		if (existing.length === 0) {
			await db.insert(schema.role).values({
				name: role.name,
				description: role.description,
				permissions: JSON.stringify(role.permissions),
			});
			console.log(`  + ${role.name}`);
		} else {
			console.log(`  ~ ${role.name} (exists)`);
		}
	}

	console.log("\nDone.");
	process.exit(0);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
