import { generateSecret, generateURI, verifySync } from "otplib";
import type { OTPVerifyOptions } from "otplib";
import { randomBytes } from "node:crypto";
import { hashSecret } from "./utils";

const verifyOptions: Partial<OTPVerifyOptions> = {
	period: 30,
	epochTolerance: 1,
};

export function generateTotpSecret(): string {
	return generateSecret();
}

export function generateTotpUri(secret: string, username: string, issuer = "Auth"): string {
	return generateURI({ issuer, label: username, secret });
}

export function verifyTotpCode(secret: string, token: string): boolean {
	try {
		const result = verifySync({ secret, token, ...verifyOptions });
		return result.valid;
	} catch {
		return false;
	}
}

export function generateBackupCodes(count = 8): string[] {
	const codes: string[] = [];
	for (let i = 0; i < count; i++) {
		codes.push(randomBytes(8).toString("hex").slice(0, 16));
	}
	return codes;
}

export function hashBackupCode(code: string): string {
	return hashSecret(code);
}

export function verifyBackupCode(hashedJson: string | null, code: string): string | null {
	if (!hashedJson) {
		return null;
	}

	const hashedCodes: string[] = JSON.parse(hashedJson);
	const inputHash = hashBackupCode(code);
	return hashedCodes.find((h) => h === inputHash) ?? null;
}

export function consumeBackupCode(existingJson: string | null, code: string): string | null {
	if (!existingJson) {
		return null;
	}

	const hashedCodes: string[] = JSON.parse(existingJson);
	const inputHash = hashBackupCode(code);
	const idx = hashedCodes.findIndex((h) => h === inputHash);
	if (idx === -1) {
		return null;
	}

	hashedCodes.splice(idx, 1);
	return JSON.stringify(hashedCodes);
}
