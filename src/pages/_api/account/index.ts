import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { invalidateUser } from "@/lib/auth/cache";
import { getAccountUser, unauthorized } from "./auth";

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
		return Response.json({ error: "not_found" }, { status: 404 });
	}

	return Response.json(user);
}

export async function PATCH(req: Request): Promise<Response> {
	const authed = await getAccountUser(req);
	if (!authed) {
		return unauthorized();
	}

	const body = (await req.json()) as Record<string, unknown>;
	const db = await getDb();
	const updates: Record<string, unknown> = {};

	const stringFields = [
		"name",
		"givenName",
		"familyName",
		"displayName",
		"nickname",
		"image",
		"phoneNumber",
		"profileUrl",
		"websiteUrl",
		"address",
		"preferredLanguage",
		"locale",
		"timezone",
	] as const;

	for (const field of stringFields) {
		if (body[field] !== undefined) {
			updates[field] = body[field] === null ? null : (body[field] as string);
		}
	}

	if (Object.keys(updates).length === 0) {
		return Response.json({ error: "no_fields_to_update" }, { status: 400 });
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
		return Response.json({ error: "not_found" }, { status: 404 });
	}

	await invalidateUser({ id: authed.userId, username: authed.user.username, email: authed.user.email });

	return Response.json(updated);
}
