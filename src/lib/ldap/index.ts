import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/utils";
import type { LdapSearchFilter, SearchResultEntryAttribute, LdapServerConfig } from "./types";

export {
	LDAP_RESULT,
	LDAP_OP,
	LDAP_SCOPE,
	type LdapSearchFilter,
	type SearchResultEntryAttribute,
	type LdapServerConfig,
} from "./types";

export function getDefaultServerConfig(): LdapServerConfig {
	return {
		domain: process.env.LDAP_DOMAIN || "authorization.local",
		port: Number(process.env.LDAP_PORT) || 1389,
		adminDn: process.env.LDAP_ADMIN_DN || "cn=admin,dc=authorization,dc=local",
		adminPassword: process.env.LDAP_ADMIN_PASSWORD || "",
		userObjectClass: process.env.LDAP_USER_OBJECT_CLASS || "inetOrgPerson",
		groupObjectClass: process.env.LDAP_GROUP_OBJECT_CLASS || "groupOfUniqueNames",
	};
}

export function extractEmailFromDn(dn: string): string | null {
	const match = dn.match(/^(?:uid|cn)=([^,]+)/i);
	return match ? match[1]! : null;
}

export function userDn(email: string, domain: string): string {
	const parts = domain
		.split(".")
		.map((p) => `dc=${p}`)
		.join(",");
	return `uid=${email},${parts}`;
}

export function groupDn(name: string, domain: string): string {
	const parts = domain
		.split(".")
		.map((p) => `dc=${p}`)
		.join(",");
	return `cn=${name},${parts}`;
}

export function mapUserToLdapEntry(
	user: {
		id: number;
		email: string;
		name: string | null;
		givenName: string | null;
		familyName: string | null;
		displayName: string | null;
		nickname: string | null;
		phoneNumber: string | null;
		profileUrl: string | null;
		loginShell: string | null;
		roleId: number | null;
	},
	domain: string,
): SearchResultEntryAttribute[] {
	const attrs: SearchResultEntryAttribute[] = [
		{ type: "dn", vals: [userDn(user.email, domain)] },
		{ type: "objectClass", vals: ["top", "person", "organizationalPerson", "inetOrgPerson"] },
		{ type: "uid", vals: [user.email] },
		{ type: "cn", vals: [user.displayName || user.name || user.email] },
		{ type: "sn", vals: [user.familyName || user.name?.split(" ").pop() || user.email] },
		{ type: "mail", vals: [user.email] },
		{ type: "uidNumber", vals: [String(user.id)] },
		{ type: "gidNumber", vals: [String(user.roleId || 500)] },
		{ type: "homeDirectory", vals: [`/home/${user.email.split("@")[0]}`] },
	];

	if (user.givenName) {
		attrs.push({ type: "givenName", vals: [user.givenName] });
	} else if (user.name) {
		attrs.push({ type: "givenName", vals: [user.name.split(" ")[0] || ""] });
	}

	if (user.displayName) {
		attrs.push({ type: "displayName", vals: [user.displayName] });
	} else if (user.name) {
		attrs.push({ type: "displayName", vals: [user.name] });
	}

	if (user.nickname) {
		attrs.push({ type: "nickname", vals: [user.nickname] });
	}

	if (user.phoneNumber) {
		attrs.push({ type: "telephoneNumber", vals: [user.phoneNumber] });
	}

	if (user.loginShell) {
		attrs.push({ type: "loginShell", vals: [user.loginShell] });
	}

	return attrs;
}

export function mapRoleToLdapEntry(
	role: { id: number; name: string; description: string | null },
	memberDns: string[],
	domain: string,
): SearchResultEntryAttribute[] {
	return [
		{ type: "dn", vals: [groupDn(role.name, domain)] },
		{ type: "objectClass", vals: ["top", "groupOfUniqueNames"] },
		{ type: "cn", vals: [role.name] },
		{ type: "description", vals: [role.description || role.name] },
		{ type: "gidNumber", vals: [String(role.id + 1000)] },
		...memberDns.map((dn) => ({ type: "uniqueMember" as const, vals: [dn] })),
	];
}

function safeCompare(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	if (bufA.length !== bufB.length) {
		return false;
	}
	return timingSafeEqual(bufA, bufB);
}

export function verifyLdapBind(adminDn: string, adminPassword: string, name: string, password: string): boolean {
	if (safeCompare(name, adminDn)) {
		return safeCompare(adminPassword, password);
	}

	const email = extractEmailFromDn(name);
	if (!email) {
		return false;
	}

	return false;
}

export async function verifyLdapUserBind(name: string, password: string): Promise<boolean> {
	const email = extractEmailFromDn(name);
	if (!email) {
		return false;
	}

	const db = await getDb();
	const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email));

	if (!user || !user.passwordHash) {
		return false;
	}
	return verifyPassword(password, user.passwordHash);
}

export function matchFilter(attributes: SearchResultEntryAttribute[], filter: LdapSearchFilter): boolean {
	switch (filter.type) {
		case 0:
			return (filter.filters ?? []).every((f) => matchFilter(attributes, f));
		case 1:
			return (filter.filters ?? []).some((f) => matchFilter(attributes, f));
		case 2:
			return filter.filters ? !matchFilter(attributes, filter.filters[0]!) : false;
		case 3: {
			const attr = attributes.find((a) => a.type.toLowerCase() === (filter.attribute ?? "").toLowerCase());
			if (!attr) {
				return false;
			}
			return attr.vals.some((v) => v === filter.value);
		}
		case 5: {
			const attr = attributes.find((a) => a.type.toLowerCase() === (filter.attribute ?? "").toLowerCase());
			if (!attr) {
				return false;
			}
			return attr.vals.some((v) => v >= (filter.value ?? ""));
		}
		case 6: {
			const attr = attributes.find((a) => a.type.toLowerCase() === (filter.attribute ?? "").toLowerCase());
			if (!attr) {
				return false;
			}
			return attr.vals.some((v) => v <= (filter.value ?? ""));
		}
		case 7:
			return attributes.some((a) => a.type.toLowerCase() === (filter.attribute ?? "").toLowerCase());
		case 8: {
			const attr = attributes.find((a) => a.type.toLowerCase() === (filter.attribute ?? "").toLowerCase());
			if (!attr) {
				return false;
			}
			return attr.vals.some((v) => v.toLowerCase().includes((filter.value ?? "").toLowerCase()));
		}
		default:
			return false;
	}
}

export async function searchUsers(domain: string): Promise<SearchResultEntryAttribute[][]> {
	const db = await getDb();
	const users = await db
		.select({
			id: schema.user.id,
			email: schema.user.email,
			name: schema.user.name,
			givenName: schema.user.givenName,
			familyName: schema.user.familyName,
			displayName: schema.user.displayName,
			nickname: schema.user.nickname,
			phoneNumber: schema.user.phoneNumber,
			profileUrl: schema.user.profileUrl,
			loginShell: schema.user.loginShell,
			roleId: schema.user.roleId,
		})
		.from(schema.user);

	return users.map((u) => mapUserToLdapEntry(u, domain));
}

export async function searchGroups(domain: string): Promise<SearchResultEntryAttribute[][]> {
	const db = await getDb();
	const roles = await db
		.select({
			id: schema.role.id,
			name: schema.role.name,
			description: schema.role.description,
		})
		.from(schema.role);

	const users = await db
		.select({
			id: schema.user.id,
			email: schema.user.email,
			roleId: schema.user.roleId,
		})
		.from(schema.user);

	const result: SearchResultEntryAttribute[][] = [];
	for (const role of roles) {
		const memberDns = users.filter((u) => u.roleId === role.id).map((u) => userDn(u.email, domain));
		result.push(mapRoleToLdapEntry(role, memberDns, domain));
	}
	return result;
}
