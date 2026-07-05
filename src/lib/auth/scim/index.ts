import { randomBytes } from "node:crypto";
import { eq, asc, desc, count as drizzleCount } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { hashPassword, usernameToEmail } from "@/lib/auth/utils";
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
	name: string | null;
	displayName: string | null;
	image: string | null;
	timezone: string | null;
	emailVerified: Date | null;
	createdAt: Date;
	updatedAt: Date;
}): ScimUser {
	const name: ScimName = {};
	if (u.name) {
		name.formatted = u.name;
	}
	return {
		id: String(u.id),
		userName: u.username,
		...(Object.keys(name).length > 0 ? { name } : {}),
		...(u.displayName ? { displayName: u.displayName } : {}),
		emails: [{ value: usernameToEmail(u.username), primary: true }],
		...(u.image ? { photos: [{ value: u.image }] } : {}),
		...(u.timezone ? { timezone: u.timezone } : {}),
		active: true,
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
		const filterMatch = params.filter.match(/^userName\s+eq\s+"(.+)"$/);
		if (filterMatch) {
			whereCondition = eq(schema.user.username, filterMatch[1]!);
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

	const cleanUsername = userName.includes("@") ? userName.split("@")[0]! : userName;

	const [inserted] = await db
		.insert(schema.user)
		.values({
			username: cleanUsername,
			passwordHash: hashPassword(randomBytes(32).toString("hex")),
			name: input.name?.formatted ?? null,
			displayName: input.displayName ?? null,
			image: input.photos?.[0]?.value ?? null,
			timezone: input.timezone ?? null,
			emailVerified: null,
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
		const cleanUsername = input.userName.includes("@") ? input.userName.split("@")[0]! : input.userName;
		values.username = cleanUsername;
	}
	if (input.name) {
		if (input.name.formatted !== undefined) {
			values.name = input.name.formatted;
		}
	}
	if (input.displayName !== undefined) {
		values.displayName = input.displayName;
	}
	if (input.photos !== undefined) {
		values.image = input.photos[0]?.value ?? null;
	}
	if (input.timezone !== undefined) {
		values.timezone = input.timezone;
	}
	if (input.active !== undefined) {
		values.emailVerified = null;
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

export function getScimResourceType(id: string): object | null {
	const resourceTypes = getScimResourceTypes() as { Resources: Array<{ id: string }> };
	const resource = resourceTypes.Resources.find((r) => r.id === id);
	return resource ?? null;
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
