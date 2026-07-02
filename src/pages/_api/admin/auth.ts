import { withSecurityHeaders } from "@/lib/http/response";
import { and, eq, gte, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getSession as getWebSession } from "@/lib/auth";
import { getRoleById, toUserResult } from "@/lib/auth/cache";
import { hashToken, parseCookie, SESSION_COOKIE_NAME } from "@/lib/auth/utils";
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
	const auth = req.headers.get("authorization");
	if (auth?.startsWith("Bearer ")) {
		const token = auth.slice(7);
		const db = await getDb();

		const [row] = await db
			.select({
				token: schema.oauthAccessToken,
				user: schema.user,
			})
			.from(schema.oauthAccessToken)
			.where(
				and(
					eq(schema.oauthAccessToken.tokenHash, hashToken(token)),
					gte(schema.oauthAccessToken.expiresAt, new Date()),
				),
			)
			.innerJoin(schema.user, eq(schema.oauthAccessToken.userId, schema.user.id));

		if (row) {
			return {
				userId: row.token.userId!,
				user: toUserResult(row.user),
			};
		}

		const [patRow] = await db
			.select({
				pat: schema.personalAccessToken,
				user: schema.user,
			})
			.from(schema.personalAccessToken)
			.where(
				and(eq(schema.personalAccessToken.tokenHash, hashToken(token)), isNull(schema.personalAccessToken.revokedAt)),
			)
			.innerJoin(schema.user, eq(schema.personalAccessToken.userId, schema.user.id));

		if (patRow) {
			const now = new Date();
			await db
				.update(schema.personalAccessToken)
				.set({ lastUsedAt: now })
				.where(eq(schema.personalAccessToken.id, patRow.pat.id));

			return {
				userId: patRow.user.id,
				user: toUserResult(patRow.user),
			};
		}

		return null;
	}

	const cookie = req.headers.get("cookie") ?? "";
	const sessionToken = parseCookie(cookie, SESSION_COOKIE_NAME);
	if (!sessionToken) {
		return null;
	}

	const session = await getWebSession(sessionToken);
	if (!session.success || !session.data) {
		return null;
	}

	return {
		userId: session.data.userId,
		user: session.data.user,
	};
}

/** Verify that the request is authenticated AND the user's role grants the required permission. */
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
