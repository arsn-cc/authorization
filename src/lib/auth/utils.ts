import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const SESSION_TTL_DAYS = 7;
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;
export const EMAIL_TWO_FACTOR_TOKEN_TTL_MINUTES = 10;
export const PENDING_AUTH_TTL_MINUTES = 5;

export function sessionKey(token: string) {
	return `session:${hashToken(token)}`;
}

// Cache key variant that takes an already-hashed token (used when deleting
// sessions by userId, where only the token hash is available from the DB).
export function sessionKeyFromHash(hash: string) {
	return `session:${hash}`;
}

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString("hex");
	const hash = scryptSync(password, salt, SCRYPT_KEYLEN, {
		N: SCRYPT_N,
		r: SCRYPT_R,
		p: SCRYPT_P,
	}).toString("hex");
	return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
	const [salt, hash] = stored.split(":");
	if (!salt || !hash) {
		return false;
	}
	const derived = scryptSync(password, salt, SCRYPT_KEYLEN, {
		N: SCRYPT_N,
		r: SCRYPT_R,
		p: SCRYPT_P,
	}).toString("hex");
	if (derived.length !== hash.length) {
		return false;
	}
	return timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
}

export function generateToken(): string {
	return randomBytes(32).toString("hex");
}

export function usernameToEmail(username: string): string {
	const domain = process.env.EMAIL_DOMAIN || "arsn.cc";
	return `${username}@${domain}`;
}

export function getEmail(user: { username: string }): string {
	return usernameToEmail(user.username);
}

export function isValidUsername(username: string): boolean {
	return /^[a-zA-Z0-9._-]{3,64}$/.test(username);
}

export function resolveToUsername(login: string): string {
	if (login.includes("@")) {
		return login.split("@")[0]!;
	}
	return login;
}

export function isValidPassword(password: string): boolean {
	if (password.length < 8) {
		return false;
	}
	if (!/[A-Z]/.test(password)) {
		return false;
	}
	if (!/[a-z]/.test(password)) {
		return false;
	}
	if (!/[0-9]/.test(password)) {
		return false;
	}
	if (!/[^A-Za-z0-9]/.test(password)) {
		return false;
	}
	return true;
}

export function hashSecret(secret: string): string {
	return createHash("sha256").update(secret).digest("hex");
}

export function hashToken(token: string): string {
	return hashSecret(token);
}

export function inDays(days: number) {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d;
}

export function inMinutes(minutes: number) {
	const d = new Date();
	d.setMinutes(d.getMinutes() + minutes);
	return d;
}

export function sessionTtlSeconds(expires: Date): number {
	return Math.max(1, Math.floor((expires.getTime() - Date.now()) / 1000));
}

export const SESSION_COOKIE_NAME = "__Host-session_token";

export function parseCookie(cookie: string, name: string): string | null {
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = cookie.match(new RegExp(`(?:^|;)\\s*${escaped}=([^;]*)`));
	if (!match) {
		return null;
	}
	try {
		return decodeURIComponent(match[1]!);
	} catch {
		return match[1]!;
	}
}
