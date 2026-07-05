export type GrantType =
	| "authorization_code"
	| "client_credentials"
	| "refresh_token"
	| "urn:ietf:params:oauth:grant-type:token-exchange";

export type TokenEndpointAuthMethod =
	| "client_secret_basic"
	| "client_secret_post"
	| "none"
	| "private_key_jwt"
	| "client_secret_jwt";

export type PkceChallengeMethod = "S256" | "plain";

export type ResponseType = "code" | "token" | "id_token";

export type SubjectType = "public" | "pairwise";

export interface AuthorizationRequest {
	responseType: ResponseType;
	clientId: string;
	redirectUri: string;
	scope: string;
	state?: string;
	codeChallenge?: string;
	codeChallengeMethod?: PkceChallengeMethod;
	nonce?: string;
	prompt?: string;
	maxAge?: number;
	loginHint?: string;
}

export interface AuthorizationCode {
	code: string;
	clientId: string;
	userId: number;
	redirectUri: string;
	scope: string;
	codeChallenge?: string;
	codeChallengeMethod?: PkceChallengeMethod;
	nonce?: string;
	authTime: Date;
	expiresAt: Date;
	usedAt?: Date;
}

export interface TokenRequest {
	grantType: GrantType;
	code?: string;
	redirectUri?: string;
	clientId: string;
	clientSecret?: string;
	codeVerifier?: string;
	refreshToken?: string;
	scope?: string;
	assertion?: string;
	subjectToken?: string;
	subjectTokenType?: string;
}

export interface TokenResponse {
	accessToken: string;
	tokenType: "Bearer" | "DPoP";
	expiresIn: number;
	refreshToken?: string;
	scope?: string;
	idToken?: string;
}

export interface ClientCredentials {
	clientId: string;
	clientSecret?: string;
	scope?: string;
}

export interface RefreshTokenData {
	token: string;
	clientId: string;
	userId: number;
	scope: string;
	expiresAt: Date;
	usedAt?: Date;
	rotatedFromToken?: string;
}

export interface IdTokenClaims {
	iss: string;
	sub: string;
	aud: string | string[];
	exp: number;
	iat: number;
	authTime?: number;
	nonce?: string;
	acr?: string;
	amr?: string[];
	azp?: string;
	atHash?: string;
	cHash?: string;
	name?: string;
	givenName?: string;
	familyName?: string;
	nickname?: string;
	preferredUsername?: string;
	picture?: string;
	email?: string;
	emailVerified?: boolean;
	phoneNumber?: string;
	phoneNumberVerified?: boolean;
	profile?: string;
	website?: string;
	address?: Record<string, unknown>;
	updatedAt?: number;
	zoneinfo?: string;
	locale?: string;
}

export interface UserInfoResponse {
	sub: string;
	name?: string;
	givenName?: string;
	familyName?: string;
	nickname?: string;
	preferredUsername?: string;
	picture?: string;
	email?: string;
	emailVerified?: boolean;
	phoneNumber?: string;
	phoneNumberVerified?: boolean;
	profile?: string;
	website?: string;
	address?: Record<string, unknown>;
	updatedAt?: number;
	zoneinfo?: string;
	locale?: string;
	[key: string]: unknown;
}

export interface OAuthClient {
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

export interface DiscoveryDocument {
	issuer: string;
	authorizationEndpoint: string;
	tokenEndpoint: string;
	userinfoEndpoint: string;
	jwksUri: string;
	registrationEndpoint?: string;
	scopesSupported: string[];
	responseTypesSupported: string[];
	responseModesSupported: string[];
	grantTypesSupported: string[];
	tokenEndpointAuthMethodsSupported: string[];
	tokenEndpointAuthSigningAlgValuesSupported: string[];
	subjectTypesSupported: string[];
	idTokenSigningAlgValuesSupported: string[];
	claimsSupported: string[];
	codeChallengeMethodsSupported: string[];
	dpopSigningAlgValuesSupported?: string[];
	mtlsEndpointAliases?: Record<string, string>;
}
