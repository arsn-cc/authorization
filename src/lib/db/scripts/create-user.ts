import { createInterface } from "node:readline/promises";
import { randomBytes, scryptSync } from "node:crypto";
import { eq } from "drizzle-orm";
import { isValidUsername, usernameToEmail } from "@/lib/auth/utils";
import { getDb } from "../index";
import { schema } from "../schema";

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString("hex");
	const hash = scryptSync(password, salt, 64).toString("hex");
	return `${salt}:${hash}`;
}

async function promptHidden(query: string): Promise<string> {
	const stdin = process.stdin;
	const wasRaw = stdin.isRaw;
	stdin.setRawMode(true);
	stdin.resume();

	process.stdout.write(query);

	return new Promise((resolve) => {
		let input = "";

		const handler = (data: Buffer) => {
			const char = data.toString();
			if (char === "\r" || char === "\n") {
				stdin.removeListener("data", handler);
				stdin.setRawMode(wasRaw ?? false);
				stdin.pause();
				process.stdout.write("\n");
				resolve(input);
			} else if (char === "\x7f" || char === "\b") {
				if (input.length > 0) {
					input = input.slice(0, -1);
					process.stdout.write("\b \b");
				}
			} else {
				input += char;
				process.stdout.write("*");
			}
		};

		stdin.on("data", handler);
	});
}

async function createUser() {
	const db = await getDb();

	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	console.log("3-64 characters, letters, numbers, dots, hyphens, underscores");
	const username = await rl.question("Username: ");
	const name = (await rl.question("Name: ")) || "User";

	if (!isValidUsername(username)) {
		console.error("Invalid username. Use 3-64 characters, letters, numbers, dots, hyphens, underscores");
		rl.close();
		process.exit(1);
	}

	const email = usernameToEmail(username);

	rl.close();

	const password = await promptHidden("Password: ");
	const confirmPassword = await promptHidden("Confirm password: ");

	if (password !== confirmPassword) {
		console.error("Passwords do not match");
		process.exit(1);
	}

	if (password.length < 8) {
		console.error("Password must be at least 8 characters");
		process.exit(1);
	}

	const existingUser = await db.select().from(schema.user).where(eq(schema.user.username, username));
	if (existingUser.length > 0) {
		console.log(`User ${username} already exists.`);
		process.exit(0);
	}

	const adminRole = await db.select().from(schema.role).where(eq(schema.role.name, "admin"));

	await db.insert(schema.user).values({
		username,
		email,
		name,
		passwordHash: hashPassword(password),
		roleId: adminRole[0]?.id ?? null,
		emailVerified: new Date(),
	});

	console.log(`\nUser ${username} (${email}) created successfully.`);
	process.exit(0);
}

createUser().catch((err) => {
	console.error("Failed:", err);
	process.exit(1);
});
