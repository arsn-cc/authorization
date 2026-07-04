import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import type { UserResult } from "./types";
import { sessionTtlSeconds, hashToken } from "./utils";

// ── TTL constants (seconds) ────────────────────────────────────────

export const CACHE_TTL_USER = 3600; // 1 hour
export const CACHE_TTL_CLIENT = 3600; // 1 hour
export const CACHE_TTL_ROLE = 3600; // 1 hour

// ── Key helpers ────────────────────────────────────────────────────

export const userByIdKey = (id: number) => `user:id:${id}`;
export const userByUsernameKey = (username: string) => `user:username:${username}`;
export const userByEmailKey = (email: string) => `user:email:${email}`;
export const clientKey = (clientId: string) => `client:${clientId}`;
export const oauthAccessTokenKey = (token: string) => `oauth:access:${token}`;
export const oauthRefreshTokenKey = (token: string) => `oauth:refresh:${token}`;
export const oauthAuthCodeKey = (code: string) => `oauth:code:${code}`;
export const roleKey = (id: number) => `role:${id}`;

// ── User helpers ───────────────────────────────────────────────────

export function toUserResult(u: typeof schema.user.$inferSelect): UserResult {
	return {
		id: u.id,
		username: u.username,
		email: u.email,
		name: u.name,
		givenName: u.givenName,
		familyName: u.familyName,
		displayName: u.displayName,
		nickname: u.nickname,
		emailVerified: u.emailVerified,
		image: u.image,
		phoneNumber: u.phoneNumber,
		phoneNumberVerified: u.phoneNumberVerified,
		profileUrl: u.profileUrl,
		websiteUrl: u.websiteUrl,
		address: u.address,
		externalId: u.externalId,
		preferredLanguage: u.preferredLanguage,
		locale: u.locale,
		timezone: u.timezone,
		loginShell: u.loginShell,
		gecos: u.gecos,
		roleId: u.roleId,
		totpEnabled: Boolean(u.totpEnabled),
		emailTwoFactorEnabled: Boolean(u.emailTwoFactorEnabled),
		createdAt: u.createdAt,
		updatedAt: u.updatedAt,
	};
}

export async function getUserById(id: number): Promise<UserResult | null> {
	const cache = await getCache();
	const key = userByIdKey(id);
	const cached = await cache.get<UserResult>(key);
	if (cached) {
		return cached;
	}

	const db = await getDb();
	const [user] = await db.select().from(schema.user).where(eq(schema.user.id, id));
	if (!user) {
		return null;
	}

	const result = toUserResult(user);
	await cache.set(key, result, CACHE_TTL_USER);
	return result;
}

export async function getUserByUsername(username: string): Promise<UserResult | null> {
	const cache = await getCache();
	const key = userByUsernameKey(username);
	const cached = await cache.get<UserResult>(key);
	if (cached) {
		return cached;
	}

	const db = await getDb();
	const [user] = await db.select().from(schema.user).where(eq(schema.user.username, username));
	if (!user) {
		return null;
	}

	const result = toUserResult(user);
	await cache.set(key, result, CACHE_TTL_USER);
	await cache.set(userByIdKey(user.id), result, CACHE_TTL_USER);
	return result;
}

export async function getUserByEmail(email: string): Promise<UserResult | null> {
	const cache = await getCache();
	const key = userByEmailKey(email);
	const cached = await cache.get<UserResult>(key);
	if (cached) {
		return cached;
	}

	const db = await getDb();
	const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email));
	if (!user) {
		return null;
	}

	const result = toUserResult(user);
	await cache.set(key, result, CACHE_TTL_USER);
	await cache.set(userByIdKey(user.id), result, CACHE_TTL_USER);
	return result;
}

/** Drop all cached entries for a user (call after user update/delete). */
export async function invalidateUser(user: { id: number; username: string; email: string }): Promise<void> {
	const cache = await getCache();
	await Promise.all([
		cache.delete(userByIdKey(user.id)),
		cache.delete(userByUsernameKey(user.username)),
		cache.delete(userByEmailKey(user.email)),
	]);
}

// ── Client helpers ─────────────────────────────────────────────────

/** The OAuthClient shape we cache — same as lib/oauth/types but without methods. */
export interface CachedOAuthClient {
	id: number;
	clientId: string;
	clientSecret: string | null;
	type: string;
	name: string;
	redirectUris: string | null;
	grants: string | null;
	scopes: string;
	requireConsent: boolean;
	pkceRequired: boolean | null;
	pkceChallengeMethod: string | null;
	accessTokenTtl: number | null;
	refreshTokenTtl: number | null;
	idTokenTtl: number | null;
	refreshTokenRotationEnabled: boolean | null;
	reuseRefreshTokens: boolean | null;
	tokenEndpointAuthMethod: string | null;
	dpopBound: boolean | null;
	mtlsBound: boolean | null;
	mtlsCertificateFingerprint: string | null;
	idTokenSignedResponseAlg: string | null;
	userinfoSignedResponseAlg: string | null;
	subjectType: string | null;
	sectorIdentifierUri: string | null;
}

export function toCachedClient(client: typeof schema.client.$inferSelect): CachedOAuthClient {
	return {
		id: client.id,
		clientId: client.clientId,
		clientSecret: client.clientSecret,
		type: client.type,
		name: client.name,
		redirectUris: client.redirectUris,
		grants: client.grants,
		scopes: client.scopes,
		requireConsent: Boolean(client.requireConsent),
		pkceRequired: client.pkceRequired === 1 ? true : client.pkceRequired === 0 ? false : null,
		pkceChallengeMethod: client.pkceChallengeMethod,
		accessTokenTtl: client.accessTokenTtl,
		refreshTokenTtl: client.refreshTokenTtl,
		idTokenTtl: client.idTokenTtl,
		refreshTokenRotationEnabled:
			client.refreshTokenRotationEnabled === 1 ? true : client.refreshTokenRotationEnabled === 0 ? false : null,
		reuseRefreshTokens: client.reuseRefreshTokens === 1 ? true : client.reuseRefreshTokens === 0 ? false : null,
		tokenEndpointAuthMethod: client.tokenEndpointAuthMethod,
		dpopBound: client.dpopBound === 1 ? true : client.dpopBound === 0 ? false : null,
		mtlsBound: client.mtlsBound === 1 ? true : client.mtlsBound === 0 ? false : null,
		mtlsCertificateFingerprint: client.mtlsCertificateFingerprint,
		idTokenSignedResponseAlg: client.idTokenSignedResponseAlg,
		userinfoSignedResponseAlg: client.userinfoSignedResponseAlg,
		subjectType: client.subjectType,
		sectorIdentifierUri: client.sectorIdentifierUri,
	};
}

export async function getClientById(clientId: string): Promise<CachedOAuthClient | null> {
	const cache = await getCache();
	const key = clientKey(clientId);
	const cached = await cache.get<CachedOAuthClient>(key);
	if (cached) {
		return cached;
	}

	const db = await getDb();
	const [client] = await db.select().from(schema.client).where(eq(schema.client.clientId, clientId));
	if (!client) {
		return null;
	}

	const result = toCachedClient(client);
	await cache.set(key, result, CACHE_TTL_CLIENT);
	return result;
}

export async function invalidateClient(clientId: string): Promise<void> {
	const cache = await getCache();
	await cache.delete(clientKey(clientId));
}

// ── Role helpers ───────────────────────────────────────────────────

export interface CachedRole {
	id: number;
	name: string;
	description: string | null;
	permissions: string;
}

export async function getRoleById(id: number): Promise<CachedRole | null> {
	const cache = await getCache();
	const key = roleKey(id);
	const cached = await cache.get<CachedRole>(key);
	if (cached) {
		return cached;
	}

	const db = await getDb();
	const [role] = await db.select().from(schema.role).where(eq(schema.role.id, id));
	if (!role) {
		return null;
	}

	await cache.set(key, role, CACHE_TTL_ROLE);
	return role;
}

export async function invalidateRole(id: number): Promise<void> {
	const cache = await getCache();
	await cache.delete(roleKey(id));
}

// ── OAuth token/code helpers ──────────────────────────────────────

export interface CachedAccessToken {
	token: string;
	clientId: string;
	userId: number | null;
	sessionId: number | null;
	scope: string;
	expiresAt: Date;
	createdAt: Date;
}

export async function cacheOAuthAccessToken(record: typeof schema.oauthAccessToken.$inferSelect): Promise<void> {
	const cache = await getCache();
	const ttl = sessionTtlSeconds(record.expiresAt);
	await cache.set(oauthAccessTokenKey(record.token), record, ttl);
}

export async function getCachedOAuthAccessToken(token: string): Promise<CachedAccessToken | null> {
	const cache = await getCache();
	const key = oauthAccessTokenKey(token);
	const cached = await cache.get<CachedAccessToken>(key);
	if (cached) {
		return cached;
	}

	const db = await getDb();
	const [row] = await db
		.select()
		.from(schema.oauthAccessToken)
		.where(eq(schema.oauthAccessToken.tokenHash, hashToken(token)));
	if (!row) {
		return null;
	}

	const ttl = sessionTtlSeconds(row.expiresAt);
	await cache.set(key, row, ttl);
	return row;
}

export async function deleteCachedOAuthAccessToken(token: string): Promise<void> {
	const cache = await getCache();
	await cache.delete(oauthAccessTokenKey(token));
}

export async function cacheOAuthRefreshToken(record: typeof schema.oauthRefreshToken.$inferSelect): Promise<void> {
	const cache = await getCache();
	const ttl = sessionTtlSeconds(record.expiresAt);
	await cache.set(oauthRefreshTokenKey(record.token), record, ttl);
}

export async function getCachedOAuthRefreshToken(
	token: string,
	clientId: string,
): Promise<typeof schema.oauthRefreshToken.$inferSelect | null> {
	const cache = await getCache();
	const key = oauthRefreshTokenKey(token);
	const cached = await cache.get<typeof schema.oauthRefreshToken.$inferSelect>(key);
	if (cached) {
		return cached;
	}

	const db = await getDb();
	const [row] = await db
		.select()
		.from(schema.oauthRefreshToken)
		.where(
			and(
				eq(schema.oauthRefreshToken.tokenHash, hashToken(token)),
				eq(schema.oauthRefreshToken.clientId, clientId),
				isNull(schema.oauthRefreshToken.usedAt),
			),
		);
	if (!row) {
		return null;
	}

	const ttl = sessionTtlSeconds(row.expiresAt);
	await cache.set(key, row, ttl);
	return row;
}

export async function deleteCachedOAuthRefreshToken(token: string): Promise<void> {
	const cache = await getCache();
	await cache.delete(oauthRefreshTokenKey(token));
}

export async function cacheOAuthAuthCode(record: typeof schema.oauthAuthorizationCode.$inferSelect): Promise<void> {
	const cache = await getCache();
	const ttl = sessionTtlSeconds(record.expiresAt);
	await cache.set(oauthAuthCodeKey(record.code), record, ttl);
}

export async function deleteCachedOAuthAuthCode(code: string): Promise<void> {
	const cache = await getCache();
	await cache.delete(oauthAuthCodeKey(code));
}
