import { and, eq, isNull } from "drizzle-orm";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { hashToken } from "@/lib/auth/utils";
import { SignJWT, importPKCS8, importSPKI, exportJWK, calculateJwkThumbprint, type JWK } from "jose";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import {
	getClientById as getCachedClient,
	getUserById as getCachedUser,
	cacheOAuthAccessToken,
	getCachedOAuthAccessToken,
	cacheOAuthRefreshToken,
	getCachedOAuthRefreshToken,
	deleteCachedOAuthRefreshToken,
	cacheOAuthAuthCode,
	deleteCachedOAuthAuthCode,
} from "@/lib/auth/cache";
import type {
	AuthorizationRequest,
	TokenRequest,
	TokenResponse,
	ClientCredentials,
	OAuthClient,
	UserInfoResponse,
	DiscoveryDocument,
	PkceChallengeMethod,
} from "./types";

export type {
	GrantType,
	TokenEndpointAuthMethod,
	PkceChallengeMethod,
	ResponseType,
	SubjectType,
	AuthorizationRequest,
	AuthorizationCode,
	TokenRequest,
	TokenResponse,
	ClientCredentials,
	RefreshTokenData,
	IdTokenClaims,
	UserInfoResponse,
	OAuthClient,
	DiscoveryDocument,
} from "./types";

function getAccessTokenTtl(): number {
	const env = process.env.OAUTH_ACCESS_TOKEN_TTL;
	if (env) {
		const parsed = Number.parseInt(env, 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			return parsed;
		}
	}
	return 3600;
}

function getRefreshTokenTtl(): number {
	const env = process.env.OAUTH_REFRESH_TOKEN_TTL;
	if (env) {
		const parsed = Number.parseInt(env, 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			return parsed;
		}
	}
	return 2592000;
}

function getIdTokenTtl(): number {
	const env = process.env.OAUTH_ID_TOKEN_TTL;
	if (env) {
		const parsed = Number.parseInt(env, 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			return parsed;
		}
	}
	return 3600;
}

function getAuthorizationCodeTtl(): number {
	const env = process.env.OAUTH_AUTHORIZATION_CODE_TTL;
	if (env) {
		const parsed = Number.parseInt(env, 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			return parsed;
		}
	}
	return 600;
}

function generateTokenValue(): string {
	return randomBytes(32).toString("hex");
}

function safeCompare(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	if (bufA.length !== bufB.length) {
		return false;
	}
	return timingSafeEqual(bufA, bufB);
}

let _keyPair: { publicKey: JWK; privateKey: CryptoKey; kid: string } | null = null;

async function getKeyPair() {
	if (_keyPair) {
		return _keyPair;
	}
	const privateKeyPem = process.env.OAUTH_PRIVATE_KEY;
	const publicKeyPem = process.env.OAUTH_PUBLIC_KEY;
	if (privateKeyPem && publicKeyPem) {
		const privateKey = await importPKCS8(privateKeyPem, "RS256");
		const publicKey = await importSPKI(publicKeyPem, "RS256");
		const jwk = await exportJWK(publicKey);
		const kid = await calculateJwkThumbprint(jwk);
		_keyPair = { publicKey: jwk, privateKey, kid };
	}
	return _keyPair;
}

export async function getClientById(clientId: string): Promise<OAuthClient | null> {
	const cached = await getCachedClient(clientId);
	if (!cached) {
		return null;
	}
	// Convert from CachedOAuthClient to OAuthClient (same shape)
	return cached as OAuthClient;
}

export async function authenticateClient(clientId: string, clientSecret?: string): Promise<OAuthClient | null> {
	const client = await getClientById(clientId);
	if (!client) {
		return null;
	}
	const method = client.tokenEndpointAuthMethod ?? "client_secret_basic";
	if (method === "none") {
		return client;
	}
	if (!client.clientSecret || !clientSecret) {
		return null;
	}
	if (!safeCompare(client.clientSecret, clientSecret)) {
		return null;
	}
	return client;
}

export function validateRedirectUri(client: OAuthClient, redirectUri: string): boolean {
	if (!client.redirectUris) {
		return false;
	}
	const uris = client.redirectUris.split(",").map((u) => u.trim());
	return uris.includes(redirectUri);
}

export function validateScope(client: OAuthClient, scope: string): boolean {
	if (!scope) {
		return false;
	}
	const allowed = client.scopes.split(" ").filter(Boolean);
	const requested = scope.split(" ").filter(Boolean);
	return requested.every((s) => allowed.includes(s));
}

async function validatePkceChallenge(
	method: string | null | undefined,
	challenge: string | null | undefined,
	verifier: string | undefined,
): Promise<boolean> {
	if (!challenge) {
		return true;
	}
	if (!verifier) {
		return false;
	}
	if (method === "S256") {
		const digest = createHash("sha256").update(verifier).digest("base64url");
		return safeCompare(challenge, digest);
	}
	if (method === "plain") {
		return safeCompare(challenge, verifier);
	}
	return false;
}

export async function generateAuthorizationCode(
	request: AuthorizationRequest,
	userId: number,
	sessionId?: number,
): Promise<string> {
	const db = await getDb();
	const code = generateTokenValue();
	const ttl = getAuthorizationCodeTtl();
	const expiresAt = new Date(Date.now() + ttl * 1000);

	const [inserted] = await db
		.insert(schema.oauthAuthorizationCode)
		.values({
			code,
			clientId: request.clientId,
			userId,
			sessionId: sessionId ?? null,
			redirectUri: request.redirectUri,
			scope: request.scope,
			codeChallenge: request.codeChallenge ?? null,
			codeChallengeMethod: request.codeChallengeMethod ?? null,
			nonce: request.nonce ?? null,
			authTime: new Date(),
			expiresAt,
		})
		.returning();

	if (inserted) {
		await cacheOAuthAuthCode(inserted);
	}

	return code;
}

export async function validateAuthorizationCode(
	code: string,
	clientId: string,
	redirectUri: string,
	codeVerifier?: string,
): Promise<{ userId: number; scope: string; nonce?: string; sessionId?: number } | null> {
	const db = await getDb();
	const [row] = await db
		.select()
		.from(schema.oauthAuthorizationCode)
		.where(
			and(
				eq(schema.oauthAuthorizationCode.code, code),
				eq(schema.oauthAuthorizationCode.clientId, clientId),
				isNull(schema.oauthAuthorizationCode.usedAt),
			),
		);

	if (!row) {
		return null;
	}

	if (row.expiresAt <= new Date()) {
		return null;
	}

	if (row.redirectUri !== redirectUri) {
		return null;
	}

	if (row.codeChallenge) {
		const method = (row.codeChallengeMethod ?? "S256") as PkceChallengeMethod;
		const valid = await validatePkceChallenge(method, row.codeChallenge, codeVerifier);
		if (!valid) {
			return null;
		}
	}

	await db
		.update(schema.oauthAuthorizationCode)
		.set({ usedAt: new Date() })
		.where(eq(schema.oauthAuthorizationCode.id, row.id));

	await deleteCachedOAuthAuthCode(code);

	const result: { userId: number; scope: string; nonce?: string; sessionId?: number } = {
		userId: row.userId,
		scope: row.scope,
	};
	if (row.nonce) {
		result.nonce = row.nonce;
	}
	if (row.sessionId) {
		result.sessionId = row.sessionId;
	}
	return result;
}

export async function validateTokenRequest(
	request: TokenRequest,
): Promise<{ client: OAuthClient; userId?: number; scope?: string }> {
	const client = await authenticateClient(request.clientId, request.clientSecret);
	if (!client) {
		throw new Error("invalid_client");
	}

	if (request.grantType === "authorization_code") {
		return { client };
	}

	if (request.grantType === "client_credentials") {
		if (!client.grants?.includes("client_credentials")) {
			throw new Error("unauthorized_client");
		}
		return { client };
	}

	if (request.grantType === "refresh_token") {
		if (!client.grants?.includes("refresh_token")) {
			throw new Error("unauthorized_client");
		}
		return { client };
	}

	throw new Error("unsupported_grant_type");
}

export async function generateAccessToken(
	client: OAuthClient,
	userId?: number,
	scope?: string,
	sessionId?: number,
): Promise<string> {
	const db = await getDb();
	const token = generateTokenValue();
	const ttl = client.accessTokenTtl ?? getAccessTokenTtl();
	const expiresAt = new Date(Date.now() + ttl * 1000);

	const [inserted] = await db
		.insert(schema.oauthAccessToken)
		.values({
			token,
			tokenHash: hashToken(token),
			clientId: client.clientId,
			userId: userId ?? null,
			sessionId: sessionId ?? null,
			scope: scope ?? client.scopes,
			expiresAt,
		})
		.returning();

	if (inserted) {
		await cacheOAuthAccessToken(inserted);
	}

	return token;
}

export async function generateRefreshToken(
	clientId: string,
	userId: number,
	scope: string,
	sessionId?: number,
): Promise<string> {
	const db = await getDb();
	const token = generateTokenValue();
	const ttl = getRefreshTokenTtl();
	const expiresAt = new Date(Date.now() + ttl * 1000);

	const [inserted] = await db
		.insert(schema.oauthRefreshToken)
		.values({
			token,
			tokenHash: hashToken(token),
			clientId,
			userId,
			sessionId: sessionId ?? null,
			scope,
			expiresAt,
		})
		.returning();

	if (inserted) {
		await cacheOAuthRefreshToken(inserted);
	}

	return token;
}

export async function generateIdToken(
	client: OAuthClient,
	userId: number,
	nonce?: string,
	authTime?: Date,
	accessToken?: string,
	code?: string,
	scope?: string,
): Promise<string> {
	const ttl = client.idTokenTtl ?? getIdTokenTtl();
	const now = Math.floor(Date.now() / 1000);
	const issuer = process.env.OAUTH_ISSUER ?? "http://localhost:3000";

	const sub = String(userId);

	let atHash: string | undefined;
	let cHash: string | undefined;

	if (accessToken) {
		const hash = createHash("sha256").update(accessToken).digest();
		atHash = hash.subarray(0, 16).toString("base64url");
	}

	if (code) {
		const hash = createHash("sha256").update(code).digest();
		cHash = hash.subarray(0, 16).toString("base64url");
	}

	const payload: Record<string, unknown> = {
		iss: issuer,
		sub,
		aud: client.clientId,
		exp: now + ttl,
		iat: now,
	};

	if (authTime) {
		payload.authTime = Math.floor(authTime.getTime() / 1000);
	}

	if (nonce) {
		payload.nonce = nonce;
	}

	if (atHash) {
		payload.atHash = atHash;
	}

	if (cHash) {
		payload.cHash = cHash;
	}

	if (scope) {
		const scopes = scope.split(" ");
		const user = await getCachedUser(userId);
		if (user) {
			if (scopes.includes("profile")) {
				if (user.name) {
					payload.name = user.name;
				}
				payload.preferredUsername = user.username;
				if (user.givenName) {
					payload.givenName = user.givenName;
				}
				if (user.familyName) {
					payload.familyName = user.familyName;
				}
				if (user.nickname) {
					payload.nickname = user.nickname;
				}
				if (user.image) {
					payload.picture = user.image;
				}
				if (user.profileUrl) {
					payload.profile = user.profileUrl;
				}
				if (user.websiteUrl) {
					payload.website = user.websiteUrl;
				}
				if (user.address) {
					try {
						payload.address = JSON.parse(user.address) as Record<string, unknown>;
					} catch {
						payload.address = user.address as unknown as Record<string, unknown>;
					}
				}
				if (user.updatedAt) {
					payload.updatedAt = Math.floor(user.updatedAt.getTime() / 1000);
				}
				if (user.timezone) {
					payload.zoneinfo = user.timezone;
				}
				if (user.locale) {
					payload.locale = user.locale;
				}
			}
			if (scopes.includes("email")) {
				payload.email = user.email;
				payload.emailVerified = !!user.emailVerified;
			}
			if (scopes.includes("phone")) {
				if (user.phoneNumber) {
					payload.phoneNumber = user.phoneNumber;
				}
				payload.phoneNumberVerified = !!user.phoneNumberVerified;
			}
		}
	}

	const keyPair = await getKeyPair();
	const clientAlg = client.idTokenSignedResponseAlg;
	const useRs256 = clientAlg === "RS256" || (!clientAlg && keyPair);

	if (useRs256) {
		if (!keyPair) {
			throw new Error("RSA keys not configured for RS256 id_token signing");
		}
		return await new SignJWT(payload)
			.setProtectedHeader({ alg: "RS256", kid: keyPair.kid, typ: "JWT" })
			.sign(keyPair.privateKey);
	}

	const secret = client.clientSecret;
	if (!secret) {
		throw new Error("Client secret required for HS256 id_token signing");
	}
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.sign(new TextEncoder().encode(secret));
}

export async function exchangeAuthorizationCode(request: TokenRequest): Promise<TokenResponse> {
	if (!request.code || !request.redirectUri) {
		throw new Error("invalid_request");
	}

	const { client } = await validateTokenRequest(request);

	const result = await validateAuthorizationCode(
		request.code,
		request.clientId,
		request.redirectUri,
		request.codeVerifier,
	);
	if (!result) {
		throw new Error("invalid_grant");
	}

	const sessionId = result.sessionId;
	const accessTokenValue = await generateAccessToken(client, result.userId, result.scope, sessionId);
	const ttl = client.accessTokenTtl ?? getAccessTokenTtl();

	const response: TokenResponse = {
		accessToken: accessTokenValue,
		tokenType: client.dpopBound ? "DPoP" : "Bearer",
		expiresIn: ttl,
		scope: result.scope,
	};

	const shouldIssueRefresh = client.grants?.includes("refresh_token");
	if (shouldIssueRefresh) {
		response.refreshToken = await generateRefreshToken(client.clientId, result.userId, result.scope, sessionId);
	}

	const isOidc = result.scope.split(" ").includes("openid");
	if (isOidc) {
		response.idToken = await generateIdToken(
			client,
			result.userId,
			result.nonce,
			undefined,
			accessTokenValue,
			request.code,
			result.scope,
		);
	}

	return response;
}

export async function exchangeClientCredentials(request: ClientCredentials): Promise<TokenResponse> {
	const client = await authenticateClient(request.clientId, request.clientSecret);
	if (!client) {
		throw new Error("invalid_client");
	}

	if (!client.grants?.includes("client_credentials")) {
		throw new Error("unauthorized_client");
	}

	const scope = request.scope ?? client.scopes;
	if (scope && !validateScope(client, scope)) {
		throw new Error("invalid_scope");
	}

	const accessTokenValue = await generateAccessToken(client, undefined, scope);
	const ttl = client.accessTokenTtl ?? getAccessTokenTtl();

	return {
		accessToken: accessTokenValue,
		tokenType: client.dpopBound ? "DPoP" : "Bearer",
		expiresIn: ttl,
		scope,
	};
}

export async function exchangeRefreshToken(request: TokenRequest): Promise<TokenResponse> {
	if (!request.refreshToken) {
		throw new Error("invalid_request");
	}

	const { client } = await validateTokenRequest(request);

	const row = await getCachedOAuthRefreshToken(request.refreshToken, request.clientId);

	if (!row) {
		throw new Error("invalid_grant");
	}

	if (row.expiresAt <= new Date()) {
		throw new Error("invalid_grant");
	}

	const db = await getDb();
	const [updated] = await db
		.update(schema.oauthRefreshToken)
		.set({ usedAt: new Date() })
		.where(and(eq(schema.oauthRefreshToken.id, row.id), isNull(schema.oauthRefreshToken.usedAt)))
		.returning({ id: schema.oauthRefreshToken.id });

	if (!updated) {
		throw new Error("invalid_grant");
	}

	await deleteCachedOAuthRefreshToken(request.refreshToken);

	const rotationEnabled = client.refreshTokenRotationEnabled ?? true;
	const reuseEnabled = client.reuseRefreshTokens ?? false;

	if (!rotationEnabled && !reuseEnabled) {
		throw new Error("invalid_grant");
	}

	const sessionId = row.sessionId ?? undefined;
	const accessTokenValue = await generateAccessToken(client, row.userId, row.scope, sessionId);
	const ttl = client.accessTokenTtl ?? getAccessTokenTtl();

	const response: TokenResponse = {
		accessToken: accessTokenValue,
		tokenType: client.dpopBound ? "DPoP" : "Bearer",
		expiresIn: ttl,
		scope: row.scope,
	};

	if (rotationEnabled) {
		const newRefreshTokenValue = await generateRefreshToken(client.clientId, row.userId, row.scope, sessionId);
		response.refreshToken = newRefreshTokenValue;
	} else if (reuseEnabled) {
		response.refreshToken = request.refreshToken;
	}

	return response;
}

/** @deprecated Use getCachedUser from @/lib/auth/cache instead */
export async function getUserById(userId: number) {
	const user = await getCachedUser(userId);
	if (!user) {
		return null;
	}
	return {
		...user,
		passwordHash: null as string | null,
		emailVerified: user.emailVerified,
	} as unknown as typeof schema.user.$inferSelect;
}

export async function getUserInfo(accessTokenValue: string, client: OAuthClient): Promise<UserInfoResponse | null> {
	const cachedToken = await getCachedOAuthAccessToken(accessTokenValue);
	if (!cachedToken || cachedToken.clientId !== client.clientId) {
		return null;
	}

	if (cachedToken.expiresAt <= new Date()) {
		return null;
	}

	const scopes = cachedToken.scope.split(" ");
	if (!scopes.includes("openid")) {
		return null;
	}

	const result: UserInfoResponse = {
		sub: String(cachedToken.userId),
	};

	if (cachedToken.userId) {
		const user = await getCachedUser(cachedToken.userId);
		if (user) {
			if (scopes.includes("profile")) {
				if (user.name) {
					result.name = user.name;
				}
				result.preferredUsername = user.username;
				if (user.givenName) {
					result.givenName = user.givenName;
				}
				if (user.familyName) {
					result.familyName = user.familyName;
				}
				if (user.nickname) {
					result.nickname = user.nickname;
				}
				if (user.image) {
					result.picture = user.image;
				}
				if (user.profileUrl) {
					result.profile = user.profileUrl;
				}
				if (user.websiteUrl) {
					result.website = user.websiteUrl;
				}
				if (user.address) {
					try {
						result.address = JSON.parse(user.address) as Record<string, unknown>;
					} catch {
						result.address = user.address as unknown as Record<string, unknown>;
					}
				}
				if (user.updatedAt) {
					result.updatedAt = Math.floor(user.updatedAt.getTime() / 1000);
				}
				if (user.timezone) {
					result.zoneinfo = user.timezone;
				}
				if (user.locale) {
					result.locale = user.locale;
				}
			}

			if (scopes.includes("email")) {
				result.email = user.email;
				result.emailVerified = !!user.emailVerified;
			}

			if (scopes.includes("phone")) {
				if (user.phoneNumber) {
					result.phoneNumber = user.phoneNumber;
				}
				result.phoneNumberVerified = !!user.phoneNumberVerified;
			}
		}
	}

	return result;
}

export async function getJwks(_client?: OAuthClient): Promise<{ keys: JWK[] }> {
	const keyPair = await getKeyPair();
	if (keyPair) {
		return { keys: [{ ...keyPair.publicKey, kid: keyPair.kid, use: "sig", alg: "RS256" }] };
	}
	return { keys: [] };
}

export async function getDiscoveryDocument(issuer: string): Promise<DiscoveryDocument> {
	const keyPair = await getKeyPair();
	const hasRsa = !!keyPair;
	const signingAlgs = hasRsa ? ["RS256", "HS256"] : ["HS256"];

	return {
		issuer,
		authorizationEndpoint: `${issuer}/oauth/authorize`,
		tokenEndpoint: `${issuer}/oauth/token`,
		userinfoEndpoint: `${issuer}/oauth/userinfo`,
		jwksUri: `${issuer}/oauth/jwks`,
		scopesSupported: ["openid", "profile", "email", "offline_access"],
		responseTypesSupported: [
			"code",
			"id_token",
			"token",
			"code id_token",
			"code token",
			"id_token token",
			"code id_token token",
		],
		responseModesSupported: ["query", "fragment", "form_post"],
		grantTypesSupported: [
			"authorization_code",
			"client_credentials",
			"refresh_token",
			"urn:ietf:params:oauth:grant-type:token-exchange",
		],
		tokenEndpointAuthMethodsSupported: ["client_secret_basic", "client_secret_post", "none"],
		tokenEndpointAuthSigningAlgValuesSupported: signingAlgs,
		subjectTypesSupported: hasRsa ? ["public", "pairwise"] : ["public"],
		idTokenSigningAlgValuesSupported: signingAlgs,
		claimsSupported: [
			"sub",
			"iss",
			"aud",
			"exp",
			"iat",
			"authTime",
			"nonce",
			"name",
			"givenName",
			"familyName",
			"nickname",
			"preferredUsername",
			"picture",
			"profile",
			"website",
			"email",
			"emailVerified",
			"phoneNumber",
			"phoneNumberVerified",
			"address",
			"updatedAt",
			"zoneinfo",
			"locale",
		],
		codeChallengeMethodsSupported: ["S256", "plain"],
	};
}

export async function getTokenIntrospection(token: string, clientId?: string): Promise<object> {
	// Check OAuth access token
	if (clientId) {
		const tokenData = await getCachedOAuthAccessToken(token);
		if (tokenData && tokenData.clientId === clientId) {
			const now = new Date();
			const active = tokenData.expiresAt > now;
			return {
				active,
				client_id: tokenData.clientId,
				sub: tokenData.userId ? String(tokenData.userId) : undefined,
				scope: tokenData.scope,
				token_type: "Bearer",
				exp: Math.floor(tokenData.expiresAt.getTime() / 1000),
				iat: tokenData.createdAt ? Math.floor(new Date(tokenData.createdAt).getTime() / 1000) : undefined,
			};
		}
	} else {
		const tokenData = await getCachedOAuthAccessToken(token);
		if (tokenData) {
			const now = new Date();
			const active = tokenData.expiresAt > now;
			return {
				active,
				client_id: tokenData.clientId,
				sub: tokenData.userId ? String(tokenData.userId) : undefined,
				scope: tokenData.scope,
				token_type: "Bearer",
				exp: Math.floor(tokenData.expiresAt.getTime() / 1000),
				iat: tokenData.createdAt ? Math.floor(new Date(tokenData.createdAt).getTime() / 1000) : undefined,
			};
		}
	}

	// Check personal access token
	const db = await getDb();
	const [pat] = await db
		.select({
			userId: schema.personalAccessToken.userId,
			name: schema.personalAccessToken.name,
			scopes: schema.personalAccessToken.scopes,
			expiresAt: schema.personalAccessToken.expiresAt,
			revokedAt: schema.personalAccessToken.revokedAt,
			createdAt: schema.personalAccessToken.createdAt,
		})
		.from(schema.personalAccessToken)
		.where(
			and(eq(schema.personalAccessToken.tokenHash, hashToken(token)), isNull(schema.personalAccessToken.revokedAt)),
		);

	if (pat) {
		const now = new Date();
		const active = !pat.expiresAt || pat.expiresAt > now;
		return {
			active,
			sub: String(pat.userId),
			scope: pat.scopes,
			token_type: "Bearer",
			name: pat.name,
			exp: pat.expiresAt ? Math.floor(pat.expiresAt.getTime() / 1000) : undefined,
			iat: Math.floor(new Date(pat.createdAt).getTime() / 1000),
		};
	}

	return { active: false };
}
