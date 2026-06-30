import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const SESSION_TTL_DAYS = 7;
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;
export const EMAIL_TWO_FACTOR_TOKEN_TTL_MINUTES = 10;
export const PENDING_AUTH_TTL_MINUTES = 5;

export function sessionKey(token: string) {
	return `session:${token}`;
}

export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString("hex");
	const hash = scryptSync(password, salt, 64).toString("hex");
	return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
	const [salt, hash] = stored.split(":");
	const derived = scryptSync(password, salt!, 64).toString("hex");
	if (derived.length !== hash!.length) {
		return false;
	}
	return timingSafeEqual(Buffer.from(derived), Buffer.from(hash!));
}

export function generateToken(): string {
	return randomBytes(32).toString("hex");
}

export function usernameToEmail(username: string): string {
	const domain = process.env.EMAIL_DOMAIN || "arsn.cc";
	return `${username}@${domain}`;
}

export function isValidUsername(username: string): boolean {
	return /^[a-zA-Z0-9._-]{3,64}$/.test(username);
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
