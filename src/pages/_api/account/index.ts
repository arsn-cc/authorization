import { withSecurityHeaders } from "@/lib/http/response";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { invalidateUser } from "@/lib/auth/cache";
import { getAccountUser, unauthorized } from "@/lib/auth/account-auth";
import { parseJsonSafe } from "@/lib/http/validate";
import { profileUpdateSchema } from "@/lib/schemas/auth";
import { usernameToEmail, isValidUsername } from "@/lib/auth/utils";
import { sendEmailChangedEmail } from "@/lib/auth/email";

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
			givenName: schema.user.givenName,
			familyName: schema.user.familyName,
			displayName: schema.user.displayName,
			nickname: schema.user.nickname,
			image: schema.user.image,
			phoneNumber: schema.user.phoneNumber,
			phoneNumberVerified: schema.user.phoneNumberVerified,
			profileUrl: schema.user.profileUrl,
			websiteUrl: schema.user.websiteUrl,
			address: schema.user.address,
			preferredLanguage: schema.user.preferredLanguage,
			locale: schema.user.locale,
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
	const [current] = await db
		.select({ username: schema.user.username, email: schema.user.email, name: schema.user.name })
		.from(schema.user)
		.where(eq(schema.user.id, authed.userId));

	if (!current) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	const updates: Record<string, unknown> = {};
	let newEmail: string | undefined;

	for (const [key, value] of Object.entries(body)) {
		if (value !== undefined) {
			updates[key] = value;
		}
	}

	if (body.username !== undefined) {
		if (!isValidUsername(body.username)) {
			return withSecurityHeaders(Response.json({ error: "invalid_username" }, { status: 400 }));
		}
		const derivedEmail = usernameToEmail(body.username);
		const [existing] = await db
			.select()
			.from(schema.user)
			.where(and(eq(schema.user.username, body.username), eq(schema.user.email, derivedEmail)))
			.limit(1);
		if (existing) {
			return withSecurityHeaders(Response.json({ error: "username_taken" }, { status: 409 }));
		}
		updates.username = body.username;
		updates.email = derivedEmail;
		newEmail = derivedEmail;
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
		givenName: schema.user.givenName,
		familyName: schema.user.familyName,
		displayName: schema.user.displayName,
		nickname: schema.user.nickname,
		image: schema.user.image,
		phoneNumber: schema.user.phoneNumber,
		profileUrl: schema.user.profileUrl,
		websiteUrl: schema.user.websiteUrl,
		address: schema.user.address,
		preferredLanguage: schema.user.preferredLanguage,
		locale: schema.user.locale,
		timezone: schema.user.timezone,
		updatedAt: schema.user.updatedAt,
	});

	if (!updated) {
		return withSecurityHeaders(Response.json({ error: "not_found" }, { status: 404 }));
	}

	await invalidateUser({ id: authed.userId, username: authed.user.username, email: authed.user.email });

	if (newEmail && newEmail !== current.email) {
		await sendEmailChangedEmail(current.email, {
			username: current.name ?? current.username,
			newEmail,
		});
	}

	return withSecurityHeaders(Response.json(updated));
}
