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
	VerifyTotpInput,
	VerifyEmailTwoFactorAndLoginInput,
	UserResult,
	LoginResult,
	PendingLoginResult,
	AuthenticatedSession,
	AuthResult,
} from "./types";
import {
	EMAIL_TWO_FACTOR_TOKEN_TTL_MINUTES,
	PASSWORD_RESET_TOKEN_TTL_MINUTES,
	PENDING_AUTH_TTL_MINUTES,
	SESSION_TTL_DAYS,
	hashSecret,
	hashToken,
	sessionKey,
	hashPassword,
	verifyPassword,
	generateToken,
	inDays,
	inMinutes,
	sessionTtlSeconds,
	usernameToEmail,
	isValidUsername,
	isValidPassword,
} from "./utils";
import { verifyTotpCode, consumeBackupCode } from "./totp";
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
import { z } from "zod";
import { renderWelcome, renderLoginNotification, renderPasswordReset, renderTwoFactor } from "@/lib/email";
import { sendEmail } from "@/lib/email/send";
import {
	sendPasswordChangedEmail,
	sendVerifyEmailForUser,
	sendAccountLockedEmail,
	sendAccountDeletionConfirmEmail,
	sendAccountDeletedEmail,
} from "@/lib/auth/email";

export type {
	RegisterInput,
	LoginInput,
	RequestPasswordResetInput,
	ResetPasswordInput,
	RequestEmailTwoFactorInput,
	VerifyTotpInput,
	VerifyEmailTwoFactorAndLoginInput,
	UserResult,
	LoginResult,
	PendingLoginResult,
	AuthenticatedSession,
	AuthResult,
	AccountTotpStatus,
} from "./types";

function ok<T>(data: T): AuthResult<T> {
	return { success: true, data };
}

function err(e: AuthError, code: string): AuthResult<never> {
	return { success: false, error: { code, message: e.message } };
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordResetUrl(token: string): string {
	const url = new URL("https://auth.arsn.cc/password-reset");
	url.searchParams.set("token", token);
	return url.toString();
}

function twoFactorUrl(pendingToken: string, emailToken: string): string {
	const url = new URL("https://auth.arsn.cc/login/e-2fa");
	url.searchParams.set("p", pendingToken);
	url.searchParams.set("c", emailToken);
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

async function sendTwoFactorEmail(to: string, username: string | null, pendingToken: string, emailToken: string) {
	if (isPreview) {
		return;
	}

	const html = await renderTwoFactor({
		...(username ? { username } : {}),
		verifyUrl: twoFactorUrl(pendingToken, emailToken),
		code: emailToken,
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
	if (!input.password || !isValidPassword(input.password)) {
		return err(
			new AuthError("Password must be at least 8 characters with uppercase, lowercase, digit, and special character"),
			"VALIDATION_ERROR",
		);
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
		const welcomeResult = await sendEmail({
			to: inserted.email,
			subject: "Welcome to ARSN - Your account has been created",
			html,
		});
		if (!welcomeResult.success) {
			console.error("Failed to send welcome email:", welcomeResult.error);
		}

		await sendVerifyEmailForUser(inserted.email, inserted.id, inserted.name);
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
	if (!input.password || !isValidPassword(input.password)) {
		return err(
			new AuthError("Password must be at least 8 characters with uppercase, lowercase, digit, and special character"),
			"VALIDATION_ERROR",
		);
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

	if (!isPreview) {
		await sendPasswordChangedEmail(user.email, {
			username: user.name ?? user.username,
		});
	}

	return ok(true as const);
}

// ── Login ───────────────────────────────────────────────────────────

export async function loginUser(input: LoginInput): Promise<AuthResult<LoginResult | PendingLoginResult>> {
	if (!input.login || !input.password) {
		return err(new AuthError("Login and password are required"), "VALIDATION_ERROR");
	}

	const db = await getDb();

	const lookup = input.login.includes("@") ? eq(schema.user.email, input.login) : eq(schema.user.username, input.login);

	const [user] = await db.select().from(schema.user).where(lookup);
	if (!user || !user.passwordHash) {
		return err(new InvalidCredentialsError(), "INVALID_CREDENTIALS");
	}

	// Check account lockout
	if (user.lockedUntil && user.lockedUntil > new Date()) {
		const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000 / 60);
		return err(new AuthError(`Account temporarily locked. Try again in ${remaining} minute(s).`), "ACCOUNT_LOCKED");
	}

	if (!verifyPassword(input.password, user.passwordHash)) {
		const attempts = (user.failedLoginAttempts ?? 0) + 1;
		await db
			.update(schema.user)
			.set({
				failedLoginAttempts: attempts,
				...(attempts >= 5 ? { lockedUntil: inMinutes(15) } : {}),
			})
			.where(eq(schema.user.id, user.id));

		if (!isPreview && attempts >= 5) {
			await sendAccountLockedEmail(user.email, {
				username: user.name ?? user.username,
			});
		}

		return err(new InvalidCredentialsError(), "INVALID_CREDENTIALS");
	}

	// Reset failed attempts on successful password verification
	await db.update(schema.user).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(schema.user.id, user.id));

	// Check if 2FA is required
	const methods: string[] = [];
	if (user.totpEnabled) {
		methods.push("totp");
	}
	if (user.emailTwoFactorEnabled) {
		methods.push("email");
	}

	if (methods.length > 0) {
		const pendingToken = generateToken();
		await db.insert(schema.pendingAuthToken).values({
			userId: user.id,
			tokenHash: hashSecret(pendingToken),
			methods: JSON.stringify(methods),
			expiresAt: inMinutes(PENDING_AUTH_TTL_MINUTES),
		});

		return ok({
			user: toUserResult(user),
			pendingAuthToken: pendingToken,
			methods,
		} satisfies PendingLoginResult);
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
			tokenHash: hashToken(token),
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

// ── TOTP verification ────────────────────────────────────────────────

export async function verifyTotpAndLogin(input: VerifyTotpInput): Promise<AuthResult<LoginResult>> {
	if (!input.pendingAuthToken || !input.totpCode) {
		return err(new AuthError("Pending auth token and verification code are required"), "VALIDATION_ERROR");
	}

	const db = await getDb();
	const tokenHash = hashSecret(input.pendingAuthToken);
	const [pending] = await db
		.select()
		.from(schema.pendingAuthToken)
		.where(and(eq(schema.pendingAuthToken.tokenHash, tokenHash), isNull(schema.pendingAuthToken.usedAt)))
		.limit(1);

	if (!pending || pending.expiresAt <= new Date()) {
		return err(new AuthError("Invalid or expired authentication session"), "INVALID_TOKEN");
	}

	const methods: string[] = JSON.parse(pending.methods);
	if (!methods.includes("totp")) {
		return err(new AuthError("TOTP verification not required"), "INVALID_REQUEST");
	}

	const user = await getUserById(pending.userId);
	if (!user) {
		return err(new AuthError("User not found"), "NOT_FOUND");
	}

	const dbUser = await db
		.select({
			totpSecret: schema.user.totpSecret,
			totpBackupCodes: schema.user.totpBackupCodes,
			totpEnabled: schema.user.totpEnabled,
		})
		.from(schema.user)
		.where(eq(schema.user.id, pending.userId))
		.then((rows) => rows[0]);

	if (!dbUser?.totpEnabled || !dbUser.totpSecret) {
		return err(new AuthError("TOTP is not enabled"), "TOTP_DISABLED");
	}

	// Check TOTP code
	if (verifyTotpCode(dbUser.totpSecret, input.totpCode)) {
		await db
			.update(schema.pendingAuthToken)
			.set({ usedAt: new Date() })
			.where(eq(schema.pendingAuthToken.id, pending.id));
		return createSessionFromPending(db, pending.userId);
	}

	// Check backup codes
	const remaining = consumeBackupCode(dbUser.totpBackupCodes, input.totpCode);
	if (remaining !== null) {
		await Promise.all([
			db.update(schema.pendingAuthToken).set({ usedAt: new Date() }).where(eq(schema.pendingAuthToken.id, pending.id)),
			db.update(schema.user).set({ totpBackupCodes: remaining }).where(eq(schema.user.id, pending.userId)),
		]);
		return createSessionFromPending(db, pending.userId);
	}

	return err(new AuthError("Invalid verification code"), "INVALID_CODE");
}

// ── Email two-factor verification (during login) ──────────────────────

export async function requestEmailTwoFactorLink(
	input: RequestEmailTwoFactorInput & { pendingAuthToken?: string },
): Promise<AuthResult<true>> {
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

	await sendTwoFactorEmail(dbUser.email, dbUser.name, input.pendingAuthToken ?? "", token);

	return ok(true as const);
}

export async function verifyEmailTwoFactorAndLogin(
	input: VerifyEmailTwoFactorAndLoginInput,
): Promise<AuthResult<LoginResult>> {
	if (!input.pendingAuthToken || !input.emailCode) {
		return err(new AuthError("Pending auth token and verification code are required"), "VALIDATION_ERROR");
	}

	const db = await getDb();
	const tokenHash = hashSecret(input.pendingAuthToken);
	const [pending] = await db
		.select()
		.from(schema.pendingAuthToken)
		.where(and(eq(schema.pendingAuthToken.tokenHash, tokenHash), isNull(schema.pendingAuthToken.usedAt)))
		.limit(1);

	if (!pending || pending.expiresAt <= new Date()) {
		return err(new AuthError("Invalid or expired authentication session"), "INVALID_TOKEN");
	}

	const methods: string[] = JSON.parse(pending.methods);
	if (!methods.includes("email")) {
		return err(new AuthError("Email verification not required"), "INVALID_REQUEST");
	}

	const emailTokenHash = hashSecret(input.emailCode);
	const [emailToken] = await db
		.select()
		.from(schema.emailTwoFactorToken)
		.where(
			and(
				eq(schema.emailTwoFactorToken.tokenHash, emailTokenHash),
				eq(schema.emailTwoFactorToken.userId, pending.userId),
				isNull(schema.emailTwoFactorToken.usedAt),
			),
		)
		.limit(1);

	if (!emailToken || emailToken.expires <= new Date()) {
		return err(new AuthError("Invalid or expired verification code"), "INVALID_TOKEN");
	}

	await Promise.all([
		db.update(schema.pendingAuthToken).set({ usedAt: new Date() }).where(eq(schema.pendingAuthToken.id, pending.id)),
		db
			.update(schema.emailTwoFactorToken)
			.set({ usedAt: new Date() })
			.where(eq(schema.emailTwoFactorToken.id, emailToken.id)),
	]);

	return createSessionFromPending(db, pending.userId);
}

async function createSessionFromPending(
	db: ReturnType<typeof getDb> extends Promise<infer T> ? T : never,
	userId: number,
): Promise<AuthResult<LoginResult>> {
	const user = await getUserById(userId);
	if (!user) {
		return err(new AuthError("User not found"), "NOT_FOUND");
	}

	const token = generateToken();
	const expires = inDays(SESSION_TTL_DAYS);

	const [inserted] = await db
		.insert(schema.session)
		.values({
			userId,
			token,
			tokenHash: hashToken(token),
			expires,
			usedAt: new Date(),
		})
		.returning();

	if (!inserted) {
		return err(new AuthError("Failed to create session"), "INTERNAL_ERROR");
	}

	const result: LoginResult = {
		user,
		token: inserted.token,
		expires: inserted.expires,
		sessionId: inserted.id,
	};

	const cache = await getCache();
	await cache.set(sessionKey(token), result, sessionTtlSeconds(expires));

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
		.where(eq(schema.session.tokenHash, hashToken(token)))
		.innerJoin(schema.user, eq(schema.session.userId, schema.user.id));

	if (!row) {
		return ok(null);
	}

	if (row.session.expires <= new Date()) {
		return ok(null);
	}

	const now = new Date();

	await db
		.update(schema.session)
		.set({ usedAt: now })
		.where(eq(schema.session.tokenHash, hashToken(token)));

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

// ── Email verification ──────────────────────────────────────────────

const tokenSchema = z.string().min(1, "Token is required");

export async function verifyEmail(token: string): Promise<AuthResult<true>> {
	const tokenResult = tokenSchema.safeParse(token);
	if (!tokenResult.success) {
		return err(new AuthError(tokenResult.error.issues[0]!.message), "VALIDATION_ERROR");
	}

	const db = await getDb();
	const tokenHash = hashSecret(token);
	const [row] = await db
		.select()
		.from(schema.emailVerificationToken)
		.where(and(eq(schema.emailVerificationToken.tokenHash, tokenHash), isNull(schema.emailVerificationToken.usedAt)))
		.limit(1);

	if (!row || row.expires <= new Date()) {
		return err(new AuthError("Invalid or expired verification token"), "INVALID_TOKEN");
	}

	await db.transaction(async (tx) => {
		await tx
			.update(schema.emailVerificationToken)
			.set({ usedAt: new Date() })
			.where(eq(schema.emailVerificationToken.id, row.id));
		await tx
			.update(schema.user)
			.set({ emailVerified: new Date(), updatedAt: new Date() })
			.where(eq(schema.user.id, row.userId));
	});

	const user = await getUserById(row.userId);
	if (user) {
		await invalidateUser({ id: user.id, username: user.username, email: user.email });
	}

	return ok(true as const);
}

// ── Account deletion ────────────────────────────────────────────────

const emailAddressSchema = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address");
const positiveIntSchema = z.number().int().positive("userId must be a positive integer");

export async function requestAccountDeletion(
	userId: number,
	email: string,
	username: string | null,
): Promise<AuthResult<true>> {
	const idResult = positiveIntSchema.safeParse(userId);
	if (!idResult.success) {
		return err(new AuthError(idResult.error.issues[0]!.message), "VALIDATION_ERROR");
	}
	const emailResult = emailAddressSchema.safeParse(email);
	if (!emailResult.success) {
		return err(new AuthError(emailResult.error.issues[0]!.message), "VALIDATION_ERROR");
	}

	if (isPreview) {
		return ok(true as const);
	}

	await sendAccountDeletionConfirmEmail(email, userId, username);

	return ok(true as const);
}

export async function confirmAccountDeletion(token: string): Promise<AuthResult<true>> {
	const tokenResult = tokenSchema.safeParse(token);
	if (!tokenResult.success) {
		return err(new AuthError(tokenResult.error.issues[0]!.message), "VALIDATION_ERROR");
	}

	const db = await getDb();
	const tokenHash = hashSecret(token);
	const [row] = await db
		.select()
		.from(schema.accountDeletionToken)
		.where(and(eq(schema.accountDeletionToken.tokenHash, tokenHash), isNull(schema.accountDeletionToken.usedAt)))
		.limit(1);

	if (!row || row.expires <= new Date()) {
		return err(new AuthError("Invalid or expired deletion token"), "INVALID_TOKEN");
	}

	const user = await getUserById(row.userId);
	if (!user || !user.email) {
		return err(new AuthError("User not found"), "NOT_FOUND");
	}

	// Send deletion notification before removing the user
	if (!isPreview) {
		await sendAccountDeletedEmail(user.email, {
			username: user.name ?? user.username,
		});
	}

	const cache = await getCache();

	const sessions = await db
		.select({ token: schema.session.token })
		.from(schema.session)
		.where(eq(schema.session.userId, row.userId));

	await db.transaction(async (tx) => {
		await tx
			.update(schema.accountDeletionToken)
			.set({ usedAt: new Date() })
			.where(eq(schema.accountDeletionToken.id, row.id));
		await tx.delete(schema.session).where(eq(schema.session.userId, row.userId));
		await tx.delete(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.userId, row.userId));
		await tx.delete(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.userId, row.userId));
		await tx.delete(schema.oauthAuthorizationCode).where(eq(schema.oauthAuthorizationCode.userId, row.userId));
		await tx.delete(schema.user).where(eq(schema.user.id, row.userId));
	});

	await Promise.all(sessions.map((s) => cache.delete(sessionKey(s.token))));

	return ok(true as const);
}

export async function logoutUser(token: string): Promise<AuthResult<true>> {
	const db = await getDb();
	const cache = await getCache();

	const [session] = await db
		.select({ id: schema.session.id })
		.from(schema.session)
		.where(eq(schema.session.tokenHash, hashToken(token)));

	await Promise.all([
		db.delete(schema.session).where(eq(schema.session.tokenHash, hashToken(token))),
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
