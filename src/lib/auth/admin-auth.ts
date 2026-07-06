import { withSecurityHeaders } from "@/lib/http/response";
import { getRoleById } from "@/lib/auth/cache";
import { getRequestUser } from "@/lib/auth/account-auth";
import type { UserResult } from "@/lib/auth/types";

export const AdminPermission = {
	UsersRead: "admin:users:read",
	UsersWrite: "admin:users:write",
	UsersDelete: "admin:users:delete",
	ClientsRead: "admin:clients:read",
	ClientsWrite: "admin:clients:write",
	ClientsDelete: "admin:clients:delete",
	SessionsRead: "admin:sessions:read",
	SessionsDelete: "admin:sessions:delete",
	RolesRead: "admin:roles:read",
	RolesWrite: "admin:roles:write",
	RolesDelete: "admin:roles:delete",
	PermissionsRead: "admin:permissions:read",
	PermissionsWrite: "admin:permissions:write",
	PermissionsDelete: "admin:permissions:delete",
	TokensRead: "admin:tokens:read",
	TokensWrite: "admin:tokens:write",
	TokensDelete: "admin:tokens:delete",
	StatsRead: "admin:stats:read",
	SettingsRead: "admin:settings:read",
	SettingsWrite: "admin:settings:write",
} as const;

export type AdminPermission = (typeof AdminPermission)[keyof typeof AdminPermission];

interface AdminUser {
	userId: number;
	user: UserResult;
}

async function getAdminUser(req: Request): Promise<AdminUser | null> {
	const authed = await getRequestUser(req);
	if (!authed) {
		return null;
	}
	return { userId: authed.userId, user: authed.user };
}

export async function requirePermission(req: Request, permission: AdminPermission): Promise<AdminUser | Response> {
	const admin = await getAdminUser(req);
	if (!admin) {
		return withSecurityHeaders(Response.json({ error: "unauthorized" }, { status: 401 }));
	}

	if (admin.user.roleId === null) {
		return withSecurityHeaders(Response.json({ error: "forbidden", message: "no role assigned" }, { status: 403 }));
	}

	const role = await getRoleById(admin.user.roleId);

	if (!role) {
		return withSecurityHeaders(Response.json({ error: "forbidden", message: "role not found" }, { status: 403 }));
	}

	let rolePermissions: string[];
	try {
		const parsed = JSON.parse(role.permissions);
		if (!Array.isArray(parsed) || !parsed.every((p): p is string => typeof p === "string")) {
			return withSecurityHeaders(
				Response.json({ error: "forbidden", message: "invalid permissions" }, { status: 403 }),
			);
		}
		rolePermissions = parsed;
	} catch {
		rolePermissions = [];
	}

	if (!rolePermissions.includes(permission)) {
		return withSecurityHeaders(
			Response.json(
				{
					error: "forbidden",
					message: `missing permission: ${permission}`,
					required: permission,
				},
				{ status: 403 },
			),
		);
	}

	return admin;
}
