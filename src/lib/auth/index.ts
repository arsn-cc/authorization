"use server";

import { and, eq, isNull, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { getCache } from "@/lib/cache";
import { AuthError, ExistingUserError, InvalidCredentialsError } from "./types";
import type {
	RegisterInput,
	LoginInput,
	RequestPasswordResetInput,
	ResetPasswordInput,
	RequestEmailTwoFactorInput,
	VerifyEmailTwoFactorInput,
	UserResult,
	LoginResult,
	AuthenticatedSession,
	AuthResult,
} from "./types";
import {
	EMAIL_TWO_FACTOR_TOKEN_TTL_MINUTES,
	PASSWORD_RESET_TOKEN_TTL_MINUTES,
	SESSION_TTL_DAYS,
	hashSecret,
	sessionKey,
	hashPassword,
	verifyPassword,
	generateToken,
	inDays,
	inMinutes,
	sessionTtlSeconds,
	usernameToEmail,
	isValidUsername,
} from "./utils";
import {
	toUserResult,
	invalidateUser,
	getUserByEmail,
	getUserById,
	userByIdKey,
	userByUsernameKey,
	userByEmailKey,
	CACHE_TTL_USER,
} from "./cache";
import { getSetting } from "@/lib/settings";
import { isPreview } from "@/lib/email/preview";
import { renderWelcome, renderLoginNotification, renderPasswordReset, renderTwoFactor } from "@/lib/email";
import { sendEmail } from "@/lib/email/send";

export { usernameToEmail, isValidUsername, hashPassword, verifyPassword, generateToken } from "./utils";

export type {
	RegisterInput,
	LoginInput,
	RequestPasswordResetInput,
	ResetPasswordInput,
	RequestEmailTwoFactorInput,
	VerifyEmailTwoFactorInput,
	UserResult,
	LoginResult,
	AuthenticatedSession,
	AuthResult,
} from "./types";

function ok<T>(data: T): AuthResult<T> {
	return { success: true, data };
}

function err(e: AuthError, code: string): AuthResult<never> {
	return { success: false, error: { code, message: e.message } };
}

function isValidEmail(email: string): boolean {
	return Boolean(email && email.includes("@"));
}

function passwordResetUrl(token: string): string {
	const base = process.env.PASSWORD_RESET_URL_BASE ?? "http://localhost:3000/reset-password";
	const url = new URL(base);
	url.searchParams.set("token", token);
	return url.toString();
}

function twoFactorUrl(token: string): string {
	const base = process.env.EMAIL_TWO_FACTOR_URL_BASE ?? "http://localhost:3000/verify-sign-in";
	const url = new URL(base);
	url.searchParams.set("token", token);
	return url.toString();
}

async function sendPasswordResetEmail(to: string, username: string | null, token: string) {
	if (isPreview) {
		return;
	}

	const html = await renderPasswordReset({
		...(username ? { username } : {}),
		resetUrl: passwordResetUrl(token),
	});
	const emailResult = await sendEmail({
		to,
		subject: "Reset your ARSN password",
		html,
	});
	if (!emailResult.success) {
		console.error("Failed to send password reset email:", emailResult.error);
	}
}

async function sendTwoFactorEmail(to: string, username: string | null, token: string) {
	if (isPreview) {
		return;
	}

	const html = await renderTwoFactor({
		...(username ? { username } : {}),
		verifyUrl: twoFactorUrl(token),
	});
	const emailResult = await sendEmail({
		to,
		subject: "Verify your ARSN sign-in",
		html,
	});
	if (!emailResult.success) {
		console.error("Failed to send two-factor email:", emailResult.error);
	}
}

// ── Registration ───────────────────────────────────────────────────

export async function registerUser(input: RegisterInput): Promise<AuthResult<UserResult>> {
	const registrationDisabled = await getSetting("disable_registration");
	if (registrationDisabled === "true") {
		return err(new AuthError("Registration is disabled"), "REGISTRATION_DISABLED");
	}
	if (!isValidUsername(input.username)) {
		return err(
			new AuthError("Username must be 3-64 characters; letters, numbers, dots, hyphens, underscores"),
			"VALIDATION_ERROR",
		);
	}
	if (!input.password || input.password.length < 8) {
		return err(new AuthError("Password must be at least 8 characters"), "VALIDATION_ERROR");
	}

	const email = usernameToEmail(input.username);
	const db = await getDb();

	const [existing] = await db
		.select()
		.from(schema.user)
		.where(or(eq(schema.user.username, input.username), eq(schema.user.email, email)))
		.limit(1);
	if (existing) {
		return err(new ExistingUserError(input.username), "EXISTING_USER");
	}

	const [inserted] = await db
		.insert(schema.user)
		.values({
			username: input.username,
			email,
			passwordHash: hashPassword(input.password),
			name: input.name ?? null,
			givenName: input.givenName ?? null,
			familyName: input.familyName ?? null,
			displayName: input.displayName ?? null,
			nickname: input.nickname ?? null,
			phoneNumber: input.phoneNumber ?? null,
			profileUrl: input.profileUrl ?? null,
			websiteUrl: input.websiteUrl ?? null,
			preferredLanguage: input.preferredLanguage ?? null,
			locale: input.locale ?? null,
			timezone: input.timezone ?? null,
		})
		.returning();

	if (!inserted) {
		return err(new AuthError("Failed to create user"), "INTERNAL_ERROR");
	}

	const userData = toUserResult(inserted);

	if (!isPreview) {
		const html = await renderWelcome(inserted.name ? { username: inserted.name } : {});
		const emailResult = await sendEmail({
			to: inserted.email,
			subject: "Welcome to ARSN - Your account has been created",
			html,
		});
		if (!emailResult.success) {
			console.error("Failed to send welcome email:", emailResult.error);
		}
	}

	// Warm cache for the new user
	const cache = await getCache();
	await Promise.all([
		cache.set(userByIdKey(inserted.id), userData, CACHE_TTL_USER),
		cache.set(userByUsernameKey(inserted.username), userData, CACHE_TTL_USER),
		cache.set(userByEmailKey(inserted.email), userData, CACHE_TTL_USER),
	]);

	return ok(userData);
}

// ── Password reset ─────────────────────────────────────────────────

export async function requestPasswordReset(input: RequestPasswordResetInput): Promise<AuthResult<true>> {
	if (!isValidEmail(input.email)) {
		return err(new AuthError("Valid email is required"), "VALIDATION_ERROR");
	}

	const user = await getUserByEmail(input.email);
	if (!user || !user.email) {
		return ok(true as const);
	}

	const db = await getDb();
	const [dbUser] = await db
		.select({
			id: schema.user.id,
			passwordHash: schema.user.passwordHash,
			email: schema.user.email,
			name: schema.user.name,
		})
		.from(schema.user)
		.where(eq(schema.user.id, user.id));

	if (!dbUser || !dbUser.passwordHash) {
		return ok(true as const);
	}

	const token = generateToken();
	await db.insert(schema.passwordResetToken).values({
		userId: dbUser.id,
		tokenHash: hashSecret(token),
		expires: inMinutes(PASSWORD_RESET_TOKEN_TTL_MINUTES),
	});

	await sendPasswordResetEmail(dbUser.email, dbUser.name, token);

	return ok(true as const);
}

export async function resetPasswordWithToken(input: ResetPasswordInput): Promise<AuthResult<true>> {
	if (!input.token) {
		return err(new AuthError("Invalid or expired reset token"), "INVALID_TOKEN");
	}
	if (!input.password || input.password.length < 8) {
		return err(new AuthError("Password must be at least 8 characters"), "VALIDATION_ERROR");
	}

	const db = await getDb();
	const tokenHash = hashSecret(input.token);
	const [resetToken] = await db
		.select()
		.from(schema.passwordResetToken)
		.where(and(eq(schema.passwordResetToken.tokenHash, tokenHash), isNull(schema.passwordResetToken.usedAt)))
		.limit(1);

	if (!resetToken || resetToken.expires <= new Date()) {
		return err(new AuthError("Invalid or expired reset token"), "INVALID_TOKEN");
	}

	const user = await getUserById(resetToken.userId);
	if (!user || !user.email) {
		return err(new AuthError("Invalid or expired reset token"), "INVALID_TOKEN");
	}

	const now = new Date();
	const sessions = await db
		.select({ token: schema.session.token })
		.from(schema.session)
		.where(eq(schema.session.userId, user.id));
	const cache = await getCache();

	await Promise.all([
		db.update(schema.passwordResetToken).set({ usedAt: now }).where(eq(schema.passwordResetToken.id, resetToken.id)),
		db
			.update(schema.user)
			.set({ passwordHash: hashPassword(input.password), updatedAt: now })
			.where(eq(schema.user.id, user.id)),
		db.delete(schema.session).where(eq(schema.session.userId, user.id)),
		...sessions.map((session) => cache.delete(sessionKey(session.token))),
	]);

	// Invalidate cached user so stale data isn't served
	await invalidateUser({ id: user.id, username: user.username, email: user.email });

	return ok(true as const);
}

// ── Email two-factor links ─────────────────────────────────────────

export async function requestEmailTwoFactorLink(input: RequestEmailTwoFactorInput): Promise<AuthResult<true>> {
	if (!isValidEmail(input.email)) {
		return err(new AuthError("Valid email is required"), "VALIDATION_ERROR");
	}

	const user = await getUserByEmail(input.email);
	if (!user || !user.emailVerified) {
		return ok(true as const);
	}

	const db = await getDb();
	const [dbUser] = await db
		.select({ id: schema.user.id, email: schema.user.email, name: schema.user.name })
		.from(schema.user)
		.where(eq(schema.user.id, user.id));
	if (!dbUser || !dbUser.email) {
		return ok(true as const);
	}

	const token = generateToken();
	await db.insert(schema.emailTwoFactorToken).values({
		userId: dbUser.id,
		tokenHash: hashSecret(token),
		expires: inMinutes(EMAIL_TWO_FACTOR_TOKEN_TTL_MINUTES),
	});

	await sendTwoFactorEmail(dbUser.email, dbUser.name, token);

	return ok(true as const);
}

export async function verifyEmailTwoFactorToken(input: VerifyEmailTwoFactorInput): Promise<AuthResult<true>> {
	if (!input.token) {
		return err(new AuthError("Invalid or expired verification link"), "INVALID_TOKEN");
	}

	const db = await getDb();
	const tokenHash = hashSecret(input.token);
	const [twoFactorToken] = await db
		.select()
		.from(schema.emailTwoFactorToken)
		.where(and(eq(schema.emailTwoFactorToken.tokenHash, tokenHash), isNull(schema.emailTwoFactorToken.usedAt)))
		.limit(1);

	if (!twoFactorToken || twoFactorToken.expires <= new Date()) {
		return err(new AuthError("Invalid or expired verification link"), "INVALID_TOKEN");
	}

	const user = await getUserById(twoFactorToken.userId);
	if (!user || !user.emailVerified) {
		return err(new AuthError("Invalid or expired verification link"), "INVALID_TOKEN");
	}

	await db
		.update(schema.emailTwoFactorToken)
		.set({ usedAt: new Date() })
		.where(eq(schema.emailTwoFactorToken.id, twoFactorToken.id));

	return ok(true as const);
}

// ── Login ───────────────────────────────────────────────────────────

export async function loginUser(input: LoginInput): Promise<AuthResult<LoginResult>> {
	if (!input.login || !input.password) {
		return err(new AuthError("Login and password are required"), "VALIDATION_ERROR");
	}

	const db = await getDb();

	const lookup = input.login.includes("@") ? eq(schema.user.email, input.login) : eq(schema.user.username, input.login);

	const [user] = await db.select().from(schema.user).where(lookup);
	if (!user || !user.passwordHash) {
		return err(new InvalidCredentialsError(), "INVALID_CREDENTIALS");
	}

	if (!verifyPassword(input.password, user.passwordHash)) {
		return err(new InvalidCredentialsError(), "INVALID_CREDENTIALS");
	}

	const token = generateToken();
	const now = new Date();
	const expires = inDays(SESSION_TTL_DAYS);

	if (user.emailVerified) {
		if (!isPreview) {
			const time = now.toISOString();
			const html = await renderLoginNotification({
				...(user.name ? { username: user.name } : {}),
				email: user.email,
				time,
				...(input.ip ? { ip: input.ip } : {}),
				...(input.location ? { location: input.location } : {}),
				...(input.timezone ? { timezone: input.timezone } : {}),
				...(input.language ? { language: input.language } : {}),
				...(input.deviceType ? { deviceType: input.deviceType } : {}),
				...(input.os ? { os: input.os } : {}),
				...(input.browser ? { browser: input.browser } : {}),
			});
			const emailResult = await sendEmail({
				to: user.email,
				subject: `Login Notification - ${time}`,
				html,
			});
			if (!emailResult.success) {
				console.error("Failed to send login notification email:", emailResult.error);
			}
		}
	}

	const [inserted] = await db
		.insert(schema.session)
		.values({
			userId: user.id,
			token,
			expires,
			usedAt: now,
			userAgent: input.userAgent ?? null,
			ip: input.ip ?? null,
			location: input.location ?? null,
			timezone: input.timezone ?? null,
			language: input.language ?? null,
			deviceType: input.deviceType ?? null,
			os: input.os ?? null,
			browser: input.browser ?? null,
		})
		.returning();

	if (!inserted) {
		return err(new AuthError("Failed to create session"), "INTERNAL_ERROR");
	}

	const result: LoginResult = {
		user: toUserResult(user),
		token: inserted.token,
		expires: inserted.expires,
		sessionId: inserted.id,
	};

	const cache = await getCache();
	await cache.set(sessionKey(token), result, sessionTtlSeconds(expires));

	// Warm user cache for subsequent lookups
	{
		const userResult = toUserResult(user);
		await Promise.all([
			cache.set(userByIdKey(user.id), userResult, CACHE_TTL_USER),
			cache.set(userByUsernameKey(user.username), userResult, CACHE_TTL_USER),
			cache.set(userByEmailKey(user.email), userResult, CACHE_TTL_USER),
		]);
	}

	return ok(result);
}

// ── Session lookup ──────────────────────────────────────────────────

export async function getSession(token: string): Promise<AuthResult<AuthenticatedSession | null>> {
	const cache = await getCache();
	const cached = await cache.get<AuthenticatedSession>(sessionKey(token));
	if (cached) {
		if (new Date(cached.expires) <= new Date()) {
			await cache.delete(sessionKey(token));
			return ok(null);
		}
		return ok(cached);
	}

	const db = await getDb();
	const [row] = await db
		.select({
			session: schema.session,
			user: schema.user,
		})
		.from(schema.session)
		.where(eq(schema.session.token, token))
		.innerJoin(schema.user, eq(schema.session.userId, schema.user.id));

	if (!row) {
		return ok(null);
	}

	if (row.session.expires <= new Date()) {
		return ok(null);
	}

	const now = new Date();

	await db.update(schema.session).set({ usedAt: now }).where(eq(schema.session.token, token));

	const result: AuthenticatedSession = {
		sessionId: row.session.id,
		userId: row.session.userId,
		token: row.session.token,
		expires: row.session.expires,
		usedAt: row.session.usedAt,
		user: toUserResult(row.user),
	};

	await cache.set(sessionKey(token), result, sessionTtlSeconds(result.expires));

	return ok(result);
}

// ── Logout ─────────────────────────────────────────────────────────

export async function logoutUser(token: string): Promise<AuthResult<true>> {
	const db = await getDb();
	const cache = await getCache();

	const [session] = await db
		.select({ id: schema.session.id })
		.from(schema.session)
		.where(eq(schema.session.token, token));

	await Promise.all([
		db.delete(schema.session).where(eq(schema.session.token, token)),
		cache.delete(sessionKey(token)),
		...(session
			? [
					db.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.sessionId, session.id)),
					db.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.sessionId, session.id)),
					db.delete(schema.oauthAuthorizationCode).where(eq(schema.oauthAuthorizationCode.sessionId, session.id)),
				]
			: []),
	]);

	return ok(true as const);
}
