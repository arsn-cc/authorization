import { eq, asc, desc, or, count as drizzleCount } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import type { ScimUser, ScimGroup, ScimName, ScimListResponse, ScimSearchParams, ScimMember } from "./types";

export type {
	ScimUser,
	ScimGroup,
	ScimListResponse,
	ScimError,
	ScimOperation,
	ScimPatchRequest,
	ScimSearchParams,
	ScimMeta,
	ScimName,
	ScimEmail,
	ScimMember,
} from "./types";

const USER_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User";
const GROUP_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:Group";
const LIST_RESPONSE_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:ListResponse";

function userToScim(u: {
	id: number;
	username: string;
	email: string;
	name: string | null;
	givenName: string | null;
	familyName: string | null;
	displayName: string | null;
	nickname: string | null;
	phoneNumber: string | null;
	profileUrl: string | null;
	externalId: string | null;
	preferredLanguage: string | null;
	locale: string | null;
	timezone: string | null;
	emailVerified: Date | null;
	createdAt: Date;
	updatedAt: Date;
}): ScimUser {
	const name: ScimName = {};
	if (u.name) { name.formatted = u.name; }
	if (u.givenName) { name.givenName = u.givenName; }
	if (u.familyName) { name.familyName = u.familyName; }
	return {
		id: String(u.id),
		userName: u.username,
		...(Object.keys(name).length > 0 ? { name } : {}),
		...(u.displayName ? { displayName: u.displayName } : {}),
		...(u.nickname ? { nickname: u.nickname } : {}),
		emails: [{ value: u.email, primary: true }],
		...(u.phoneNumber ? { phoneNumbers: [{ value: u.phoneNumber }] } : {}),
		...(u.profileUrl ? { photos: [{ value: u.profileUrl }] } : {}),
		...(u.externalId ? { externalId: u.externalId } : {}),
		...(u.preferredLanguage ? { preferredLanguage: u.preferredLanguage } : {}),
		...(u.locale ? { locale: u.locale } : {}),
		...(u.timezone ? { timezone: u.timezone } : {}),
		active: u.emailVerified !== null,
		meta: {
			resourceType: "User",
			created: u.createdAt.toISOString(),
			lastModified: u.updatedAt.toISOString(),
			version: `W/${Math.floor(u.updatedAt.getTime() / 1000)}`,
		},
		schemas: [USER_SCHEMA],
	};
}

function roleToScim(r: { id: number; name: string; description: string | null }, members?: ScimMember[]): ScimGroup {
	const now = new Date();
	return {
		id: String(r.id),
		displayName: r.name,
		...(members ? { members } : {}),
		meta: {
			resourceType: "Group",
			created: now.toISOString(),
			lastModified: now.toISOString(),
			version: `W/${Math.floor(now.getTime() / 1000)}`,
		},
		schemas: [GROUP_SCHEMA],
	};
}

async function getRoleMembers(roleId: number): Promise<ScimMember[]> {
	const db = await getDb();
	const users = await db
		.select({ id: schema.user.id, name: schema.user.name })
		.from(schema.user)
		.where(eq(schema.user.roleId, roleId));

	return users.map((u) => {
		const m: ScimMember = { value: String(u.id) };
		if (u.name) {
			m.display = u.name;
		}
		return m;
	});
}

export async function listUsers(params: ScimSearchParams): Promise<ScimListResponse<ScimUser>> {
	const db = await getDb();
	const startIndex = params.startIndex ?? 1;
	const pageSize = params.count ?? 100;

	let whereCondition: unknown;
	if (params.filter) {
		const filterMatch = params.filter.match(/^(?:userName|email)\s+eq\s+"(.+)"$/);
		if (filterMatch) {
			whereCondition = or(eq(schema.user.username, filterMatch[1]!), eq(schema.user.email, filterMatch[1]!));
		}
	}

	const [countRow] = await db
		.select({ value: drizzleCount() })
		.from(schema.user)
		.where(whereCondition as ReturnType<typeof eq> | undefined);

	const totalResults = countRow?.value ?? 0;

	const orderBy =
		params.sortBy === "userName" || params.sortBy === "email"
			? params.sortOrder === "descending"
				? desc(schema.user.username)
				: asc(schema.user.username)
			: params.sortBy === "displayName" || params.sortBy === "name"
				? params.sortOrder === "descending"
					? desc(schema.user.name)
					: asc(schema.user.name)
				: asc(schema.user.id);

	const rows = await db
		.select()
		.from(schema.user)
		.where(whereCondition as ReturnType<typeof eq> | undefined)
		.orderBy(orderBy);

	const startIdx = Math.max(0, Math.min(startIndex - 1, rows.length));
	const endIdx = Math.min(startIdx + pageSize, rows.length);
	const page = rows.slice(startIdx, endIdx);

	return {
		Resources: page.map(userToScim),
		totalResults,
		itemsPerPage: pageSize,
		startIndex,
		schemas: [LIST_RESPONSE_SCHEMA],
	};
}

export async function getUser(id: number | string): Promise<ScimUser | null> {
	const db = await getDb();
	const numericId = typeof id === "string" ? Number.parseInt(id, 10) : id;
	if (Number.isNaN(numericId)) {
		return null;
	}

	const [row] = await db.select().from(schema.user).where(eq(schema.user.id, numericId));

	if (!row) {
		return null;
	}

	return userToScim(row);
}

export async function createUser(input: Partial<ScimUser>): Promise<ScimUser> {
	const db = await getDb();

	const userName = input.userName ?? input.emails?.[0]?.value;
	if (!userName) {
		throw new Error("userName or email is required");
	}

	const email = userName.includes("@") ? userName : `${userName}@arsn.cc`;

	const [inserted] = await db
		.insert(schema.user)
		.values({
			username: userName.includes("@") ? userName.split("@")[0]! : userName,
			email,
			name: input.name?.formatted ?? null,
			givenName: input.name?.givenName ?? null,
			familyName: input.name?.familyName ?? null,
			displayName: input.displayName ?? null,
			nickname: input.nickname ?? null,
			phoneNumber: input.phoneNumbers?.[0]?.value ?? null,
			profileUrl: input.photos?.[0]?.value ?? null,
			externalId: input.externalId ?? null,
			preferredLanguage: input.preferredLanguage ?? null,
			locale: input.locale ?? null,
			timezone: input.timezone ?? null,
			emailVerified: input.active !== false ? new Date() : null,
		})
		.returning();

	if (!inserted) {
		throw new Error("Failed to create user");
	}

	return userToScim(inserted);
}

export async function updateUser(id: number, input: Partial<ScimUser>): Promise<ScimUser> {
	const db = await getDb();

	const values: Record<string, unknown> = { updatedAt: new Date() };
	if (input.userName) {
		values.username = input.userName;
		values.email = input.userName.includes("@") ? input.userName : `${input.userName}@arsn.cc`;
	}
	if (input.name) {
		if (input.name.formatted !== undefined) { values.name = input.name.formatted; }
		if (input.name.givenName !== undefined) { values.givenName = input.name.givenName; }
		if (input.name.familyName !== undefined) { values.familyName = input.name.familyName; }
	}
	if (input.displayName !== undefined) {
		values.displayName = input.displayName;
	}
	if (input.nickname !== undefined) {
		values.nickname = input.nickname;
	}
	if (input.phoneNumbers !== undefined) {
		values.phoneNumber = input.phoneNumbers[0]?.value ?? null;
	}
	if (input.photos !== undefined) {
		values.profileUrl = input.photos[0]?.value ?? null;
	}
	if (input.externalId !== undefined) {
		values.externalId = input.externalId;
	}
	if (input.preferredLanguage !== undefined) {
		values.preferredLanguage = input.preferredLanguage;
	}
	if (input.locale !== undefined) {
		values.locale = input.locale;
	}
	if (input.timezone !== undefined) {
		values.timezone = input.timezone;
	}
	if (input.active !== undefined) {
		values.emailVerified = input.active ? new Date() : null;
	}

	const [updated] = await db.update(schema.user).set(values).where(eq(schema.user.id, id)).returning();

	if (!updated) {
		throw new Error("User not found");
	}

	return userToScim(updated);
}

export async function deleteUser(id: number): Promise<void> {
	const db = await getDb();
	await db.delete(schema.user).where(eq(schema.user.id, id));
}

export async function listGroups(params: ScimSearchParams): Promise<ScimListResponse<ScimGroup>> {
	const db = await getDb();
	const startIndex = params.startIndex ?? 1;
	const pageSize = params.count ?? 100;

	let whereCondition: unknown;
	if (params.filter) {
		const nameMatch = params.filter.match(/^displayName\s+eq\s+"(.+)"$/);
		if (nameMatch) {
			whereCondition = eq(schema.role.name, nameMatch[1]!);
		}
	}

	const [countRow] = await db
		.select({ value: drizzleCount() })
		.from(schema.role)
		.where(whereCondition as ReturnType<typeof eq> | undefined);

	const totalResults = countRow?.value ?? 0;

	const orderBy =
		params.sortBy === "displayName"
			? params.sortOrder === "descending"
				? desc(schema.role.name)
				: asc(schema.role.name)
			: asc(schema.role.id);

	const rows = await db
		.select()
		.from(schema.role)
		.where(whereCondition as ReturnType<typeof eq> | undefined)
		.orderBy(orderBy);

	const startIdx = Math.max(0, Math.min(startIndex - 1, rows.length));
	const endIdx = Math.min(startIdx + pageSize, rows.length);
	const page = rows.slice(startIdx, endIdx);

	const groups: ScimGroup[] = [];
	for (const role of page) {
		const members = await getRoleMembers(role.id);
		groups.push(roleToScim(role, members));
	}

	return {
		Resources: groups,
		totalResults,
		itemsPerPage: pageSize,
		startIndex,
		schemas: [LIST_RESPONSE_SCHEMA],
	};
}

export async function getGroup(id: number): Promise<ScimGroup | null> {
	const db = await getDb();

	const [row] = await db.select().from(schema.role).where(eq(schema.role.id, id));

	if (!row) {
		return null;
	}

	const members = await getRoleMembers(row.id);
	return roleToScim(row, members);
}

export async function createGroup(input: Partial<ScimGroup>): Promise<ScimGroup> {
	const db = await getDb();

	if (!input.displayName) {
		throw new Error("displayName is required");
	}

	const [inserted] = await db.insert(schema.role).values({ name: input.displayName }).returning();

	if (!inserted) {
		throw new Error("Failed to create group");
	}

	return roleToScim(inserted);
}

export async function deleteGroup(id: number): Promise<void> {
	const db = await getDb();
	await db.delete(schema.role).where(eq(schema.role.id, id));
}

export function getScimServiceProviderConfig(): object {
	return {
		schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
		documentationUri: "https://example.com/scim",
		patch: { supported: true },
		bulk: { supported: false },
		filter: { supported: true, maxResults: 100 },
		changePassword: { supported: false },
		sort: { supported: true },
		etag: { supported: true },
		authenticationSchemes: [
			{
				name: "OAuth Bearer Token",
				description: "Authentication scheme using Bearer Token",
				specUri: "https://www.rfc-editor.org/info/rfc6750",
				type: "oauthbearertoken",
				primary: true,
			},
		],
	};
}

export function getScimResourceTypes(): object {
	return {
		schemas: [LIST_RESPONSE_SCHEMA],
		totalResults: 2,
		itemsPerPage: 2,
		startIndex: 1,
		Resources: [
			{
				id: "User",
				name: "User",
				endpoint: "/scim/v2/Users",
				description: "User account",
				schema: USER_SCHEMA,
				schemaExtensions: [],
				meta: { resourceType: "ResourceType", created: "2024-01-01T00:00:00Z", lastModified: "2024-01-01T00:00:00Z" },
			},
			{
				id: "Group",
				name: "Group",
				endpoint: "/scim/v2/Groups",
				description: "Group/role",
				schema: GROUP_SCHEMA,
				schemaExtensions: [],
				meta: { resourceType: "ResourceType", created: "2024-01-01T00:00:00Z", lastModified: "2024-01-01T00:00:00Z" },
			},
		],
	};
}

export function getScimSchemas(): object {
	return {
		schemas: [LIST_RESPONSE_SCHEMA],
		totalResults: 2,
		itemsPerPage: 2,
		startIndex: 1,
		Resources: [
			{
				id: USER_SCHEMA,
				name: "User",
				description: "SCIM Core User Schema",
				attributes: [
					{
						name: "id",
						type: "string",
						multiValued: false,
						required: true,
						caseExact: false,
						mutability: "readOnly",
						return: "always",
						uniqueness: "server",
					},
					{
						name: "userName",
						type: "string",
						multiValued: false,
						required: true,
						caseExact: false,
						mutability: "readWrite",
						return: "always",
						uniqueness: "server",
					},
					{
						name: "displayName",
						type: "string",
						multiValued: false,
						required: false,
						caseExact: false,
						mutability: "readWrite",
						return: "default",
					},
					{
						name: "name",
						type: "complex",
						multiValued: false,
						required: false,
						mutability: "readWrite",
						return: "default",
					},
					{
						name: "emails",
						type: "complex",
						multiValued: true,
						required: false,
						mutability: "readWrite",
						return: "default",
					},
					{
						name: "active",
						type: "boolean",
						multiValued: false,
						required: false,
						mutability: "readWrite",
						return: "default",
					},
				],
				meta: { resourceType: "Schema", created: "2024-01-01T00:00:00Z", lastModified: "2024-01-01T00:00:00Z" },
			},
			{
				id: GROUP_SCHEMA,
				name: "Group",
				description: "SCIM Core Group Schema",
				attributes: [
					{
						name: "id",
						type: "string",
						multiValued: false,
						required: true,
						caseExact: false,
						mutability: "readOnly",
						return: "always",
						uniqueness: "server",
					},
					{
						name: "displayName",
						type: "string",
						multiValued: false,
						required: true,
						caseExact: false,
						mutability: "readWrite",
						return: "default",
					},
					{
						name: "members",
						type: "complex",
						multiValued: true,
						required: false,
						mutability: "readWrite",
						return: "default",
					},
				],
				meta: { resourceType: "Schema", created: "2024-01-01T00:00:00Z", lastModified: "2024-01-01T00:00:00Z" },
			},
		],
	};
}
