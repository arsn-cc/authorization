export class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AuthError";
	}
}

export class ExistingUserError extends AuthError {
	constructor(email: string) {
		super(`User with email ${email} already exists`);
		this.name = "ExistingUserError";
	}
}

export class InvalidCredentialsError extends AuthError {
	constructor() {
		super("Invalid email or password");
		this.name = "InvalidCredentialsError";
	}
}

export class SessionNotFoundError extends AuthError {
	constructor() {
		super("Session not found");
		this.name = "SessionNotFoundError";
	}
}

export interface RegisterInput {
	email: string;
	password: string;
	name?: string;
}

export interface LoginInput {
	email: string;
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

export interface VerifyEmailTwoFactorInput {
	token: string;
}

export interface UserResult {
	id: number;
	email: string;
	name: string | null;
	emailVerified: Date | null;
	image: string | null;
	roleId: number | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface LoginResult {
	user: UserResult;
	token: string;
	expires: Date;
	sessionId: number;
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
