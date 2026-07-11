import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM encryption for secrets stored at rest (e.g. TOTP seeds).
// Encrypted values are tagged with a `enc:v1:` prefix so readers can tell
// them apart from legacy plaintext. When ENCRYPTION_KEY is unset, values are
// stored as-is (backward compatible) — configure the key in production.
const ALGO = "aes-256-gcm";
const PREFIX = "enc:v1:";

function getKey(): Buffer | null {
	const k = process.env.ENCRYPTION_KEY;
	if (!k) {
		return null;
	}
	if (/^[0-9a-fA-F]{64}$/.test(k)) {
		return Buffer.from(k, "hex");
	}
	return Buffer.from(k, "base64");
}

export function encryptSecret(plain: string): string {
	const key = getKey();
	if (!key) {
		return plain;
	}
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALGO, key, iv);
	const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptSecret(value: string | null): string | null {
	if (!value) {
		return value;
	}
	const key = getKey();
	if (!key || !value.startsWith(PREFIX)) {
		return value;
	}
	try {
		const raw = Buffer.from(value.slice(PREFIX.length), "base64url");
		const iv = raw.subarray(0, 12);
		const tag = raw.subarray(12, 28);
		const enc = raw.subarray(28);
		const decipher = createDecipheriv(ALGO, key, iv);
		decipher.setAuthTag(tag);
		return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
	} catch {
		return value;
	}
}
