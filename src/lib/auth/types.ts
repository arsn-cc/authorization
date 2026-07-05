export class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AuthError";
	}
}

export class ExistingUserError extends AuthError {
	constructor(username: string) {
		super(`User ${username} already exists`);
		this.name = "ExistingUserError";
	}
}

export class InvalidCredentialsError extends AuthError {
	constructor() {
		super("Invalid login or password");
		this.name = "InvalidCredentialsError";
	}
}

export interface RegisterInput {
	username: string;
	password: string;
	name?: string;
	displayName?: string;
	timezone?: string;
}

export interface LoginInput {
	login: string;
	password: string;
	userAgent?: string;
	ip?: string;
	location?: string;
	timezone?: string;
	language?: string;
	deviceType?: string;
	os?: string;
	browser?: string;
}

export interface RequestPasswordResetInput {
	email: string;
}

export interface ResetPasswordInput {
	token: string;
	password: string;
}

export interface RequestEmailTwoFactorInput {
	email: string;
}

export interface UserResult {
	id: number;
	username: string;
	name: string | null;
	displayName: string | null;
	emailVerified: Date | null;
	image: string | null;
	timezone: string | null;
	roleId: number | null;
	totpEnabled: boolean;
	emailTwoFactorEnabled: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface LoginResult {
	user: UserResult;
	token: string;
	expires: Date;
	sessionId: number;
}

export interface PendingLoginResult {
	user: UserResult;
	pendingAuthToken: string;
	methods: string[];
}

export interface VerifyTotpInput {
	pendingAuthToken: string;
	totpCode: string;
}

export interface VerifyEmailTwoFactorAndLoginInput {
	pendingAuthToken: string;
	emailCode: string;
}

export interface AccountTotpStatus {
	enabled: boolean;
	secret?: string;
	uri?: string;
	backupCodes?: string[];
}

export interface AuthenticatedSession {
	sessionId: number;
	userId: number;
	token: string;
	expires: Date;
	usedAt: Date | null;
	user: UserResult;
}

export type AuthResult<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };
