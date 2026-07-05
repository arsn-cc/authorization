import { z } from "zod";
import {
	renderPasswordChanged,
	renderVerifyEmail,
	renderAccountDeletionConfirm,
	renderAccountDeleted,
	renderAccountDeletedAdmin,
	renderAccountLocked,
	renderAccountLockedAdmin,
	renderAccountSuspended,
} from "@/lib/email";
import type {
	PasswordChangedEmailProps,
	AccountDeletedEmailProps,
	AccountDeletedAdminEmailProps,
	AccountLockedEmailProps,
	AccountLockedAdminEmailProps,
	AccountSuspendedEmailProps,
} from "@/lib/email";
import { sendEmail } from "@/lib/email/send";
import { isPreview } from "@/lib/email/preview";
import { generateToken, hashSecret, inMinutes } from "./utils";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailSchema = z.string().regex(EMAIL_REGEX, "Invalid email address");
const userIdSchema = z.number().int().positive("userId must be a positive integer");

const VERIFY_EMAIL_TTL_MINUTES = 60;
const ACCOUNT_DELETION_TTL_MINUTES = 60;
const ACCOUNT_UNLOCK_TTL_MINUTES = 60;

type EmailResult = { success: true } | { success: false; error: string };

function validationError(message: string): EmailResult {
	return { success: false, error: message };
}

async function send(name: string, to: string, subject: string, html: string): Promise<EmailResult> {
	if (isPreview) {
		return { success: true };
	}

	const result = await sendEmail({ to, subject, html });
	if (!result.success) {
		console.error(`Failed to send ${name} email to ${to}:`, result.error);
		return { success: false, error: result.error.message };
	}
	return { success: true };
}

// ── Password changed ─────────────────────────────────────────────────

export async function sendPasswordChangedEmail(to: string, props: PasswordChangedEmailProps): Promise<EmailResult> {
	const emailResult = emailSchema.safeParse(to);
	if (!emailResult.success) {
		return validationError("to: " + emailResult.error.issues[0]!.message);
	}
	const html = await renderPasswordChanged(props);
	return send("password_changed", to, "Your password has been changed", html);
}

// ── Email verification ───────────────────────────────────────────────

export async function sendVerifyEmailForUser(
	to: string,
	userId: number,
	username: string | null,
): Promise<EmailResult> {
	const emailResult = emailSchema.safeParse(to);
	if (!emailResult.success) {
		return validationError("to: " + emailResult.error.issues[0]!.message);
	}
	const idResult = userIdSchema.safeParse(userId);
	if (!idResult.success) {
		return validationError("userId: " + idResult.error.issues[0]!.message);
	}
	const token = generateToken();
	const tokenHash = hashSecret(token);
	const db = await getDb();

	await db.insert(schema.emailVerificationToken).values({
		userId,
		tokenHash,
		expires: inMinutes(VERIFY_EMAIL_TTL_MINUTES),
	});

	const html = await renderVerifyEmail({
		...(username ? { username } : {}),
		token,
	});
	return send("verify_email", to, "Verify your email address", html);
}

// ── Account deletion ─────────────────────────────────────────────────

export async function sendAccountDeletionConfirmEmail(
	to: string,
	userId: number,
	username: string | null,
): Promise<EmailResult> {
	const emailResult = emailSchema.safeParse(to);
	if (!emailResult.success) {
		return validationError("to: " + emailResult.error.issues[0]!.message);
	}
	const idResult = userIdSchema.safeParse(userId);
	if (!idResult.success) {
		return validationError("userId: " + idResult.error.issues[0]!.message);
	}
	const token = generateToken();
	const tokenHash = hashSecret(token);
	const db = await getDb();

	await db.insert(schema.accountDeletionToken).values({
		userId,
		tokenHash,
		expires: inMinutes(ACCOUNT_DELETION_TTL_MINUTES),
	});

	const html = await renderAccountDeletionConfirm({
		...(username ? { username } : {}),
		token,
	});
	return send("account_deletion_confirm", to, "Confirm account deletion", html);
}

export async function sendAccountDeletedEmail(to: string, props: AccountDeletedEmailProps): Promise<EmailResult> {
	const emailResult = emailSchema.safeParse(to);
	if (!emailResult.success) {
		return validationError("to: " + emailResult.error.issues[0]!.message);
	}
	const html = await renderAccountDeleted(props);
	return send("account_deleted", to, "Your account has been deleted", html);
}

export async function sendAccountDeletedAdminEmail(
	to: string,
	props: AccountDeletedAdminEmailProps,
): Promise<EmailResult> {
	const emailResult = emailSchema.safeParse(to);
	if (!emailResult.success) {
		return validationError("to: " + emailResult.error.issues[0]!.message);
	}
	const html = await renderAccountDeletedAdmin(props);
	return send("account_deleted_admin", to, "Your account has been deleted by an administrator", html);
}

// ── Account lock ─────────────────────────────────────────────────────

export async function sendAccountLockedEmail(
	to: string,
	props: AccountLockedEmailProps,
	userId?: number,
): Promise<EmailResult> {
	const emailResult = emailSchema.safeParse(to);
	if (!emailResult.success) {
		return validationError("to: " + emailResult.error.issues[0]!.message);
	}

	let unlockToken: string | undefined;

	if (userId !== undefined) {
		const idResult = userIdSchema.safeParse(userId);
		if (!idResult.success) {
			return validationError("userId: " + idResult.error.issues[0]!.message);
		}
		unlockToken = generateToken();
		const tokenHash = hashSecret(unlockToken);
		const db = await getDb();
		await db.insert(schema.accountUnlockToken).values({
			userId,
			tokenHash,
			expires: inMinutes(ACCOUNT_UNLOCK_TTL_MINUTES),
		});
	}

	const html = await renderAccountLocked({
		...(props.username ? { username: props.username } : {}),
		...(unlockToken ? { unlockToken } : {}),
	});
	return send("account_locked", to, "Your account has been locked", html);
}

export async function sendAccountLockedAdminEmail(
	to: string,
	props: AccountLockedAdminEmailProps,
): Promise<EmailResult> {
	const emailResult = emailSchema.safeParse(to);
	if (!emailResult.success) {
		return validationError("to: " + emailResult.error.issues[0]!.message);
	}
	const html = await renderAccountLockedAdmin(props);
	return send("account_locked_admin", to, "Your account has been locked by an administrator", html);
}

// ── Account suspended ────────────────────────────────────────────────

export async function sendAccountSuspendedEmail(to: string, props: AccountSuspendedEmailProps): Promise<EmailResult> {
	const emailResult = emailSchema.safeParse(to);
	if (!emailResult.success) {
		return validationError("to: " + emailResult.error.issues[0]!.message);
	}
	const html = await renderAccountSuspended(props);
	return send("account_suspended", to, "Your account has been suspended", html);
}
