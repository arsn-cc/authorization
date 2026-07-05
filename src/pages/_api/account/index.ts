import { withSecurityHeaders } from "@/lib/http/response";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { invalidateUser } from "@/lib/auth/cache";
import { getAccountUser, unauthorized } from "@/lib/auth/account-auth";
import { parseJsonSafe } from "@/lib/http/validate";
import { profileUpdateSchema } from "@/lib/schemas/auth";

export async function GET(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const db = await getDb();
	const [user] = await db
		.select({
			id: schema.user.id,
			username: schema.user.username,
			email: schema.user.email,
			emailVerified: schema.user.emailVerified,
			name: schema.user.name,
			displayName: schema.user.displayName,
			image: schema.user.image,
			banner: schema.user.banner,
			timezone: schema.user.timezone,
			roleId: schema.user.roleId,
			createdAt: schema.user.createdAt,
			updatedAt: schema.user.updatedAt,
		})
		.from(schema.user)
		.where(eq(schema.user.id, authed.userId));

	if (!user) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	return withSecurityHeaders(Response.json(user));
}

export async function PATCH(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const body = await parseJsonSafe(req, profileUpdateSchema);
	if (body instanceof Response) {
		return body;
	}

	const db = await getDb();

	const updates: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(body)) {
		if (value !== undefined) {
			updates[key] = value;
		}
	}

	if (Object.keys(updates).length === 0) {
		return withSecurityHeaders(Response.json({ error: "no_fields_to_update" }, { status: 400 }));
	}

	updates.updatedAt = new Date();

	const [updated] = await db.update(schema.user).set(updates).where(eq(schema.user.id, authed.userId)).returning({
		id: schema.user.id,
		username: schema.user.username,
		email: schema.user.email,
		name: schema.user.name,
		displayName: schema.user.displayName,
		image: schema.user.image,
		banner: schema.user.banner,
		timezone: schema.user.timezone,
		updatedAt: schema.user.updatedAt,
	});

	if (!updated) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	await invalidateUser({ id: authed.userId, username: authed.user.username, email: authed.user.email });

	return withSecurityHeaders(Response.json(updated));
}
