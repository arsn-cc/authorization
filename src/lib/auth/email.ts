import {
	renderPasswordChanged,
	renderEmailChanged,
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
	EmailChangedEmailProps,
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

const VERIFY_EMAIL_TTL_MINUTES = 60;
const ACCOUNT_DELETION_TTL_MINUTES = 60;

type EmailResult = { success: true } | { success: false; error: string };

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

function verifyEmailUrlBase(): string {
	return process.env.VERIFY_EMAIL_URL_BASE ?? `http://localhost:3000/verify-email`;
}

function deletionConfirmUrlBase(): string {
	return process.env.ACCOUNT_DELETION_CONFIRM_URL_BASE ?? `http://localhost:3000/delete-account`;
}

function withToken(urlBase: string, token: string): string {
	const url = new URL(urlBase);
	url.searchParams.set("token", token);
	return url.toString();
}

// ── Password changed ─────────────────────────────────────────────────

export async function sendPasswordChangedEmail(to: string, props: PasswordChangedEmailProps): Promise<EmailResult> {
	const html = await renderPasswordChanged(props);
	return send("password_changed", to, "Your ARSN password has been changed", html);
}

// ── Email changed ────────────────────────────────────────────────────

export async function sendEmailChangedEmail(to: string, props: EmailChangedEmailProps): Promise<EmailResult> {
	const html = await renderEmailChanged(props);
	return send("email_changed", to, "Your ARSN email address has been changed", html);
}

// ── Email verification ───────────────────────────────────────────────

export async function sendVerifyEmail(to: string, username: string | null): Promise<EmailResult & { token?: string }> {
	const token = generateToken();
	const tokenHash = hashSecret(token);
	const db = await getDb();

	await db.insert(schema.emailVerificationToken).values({
		userId: 0,
		tokenHash,
		expires: inMinutes(VERIFY_EMAIL_TTL_MINUTES),
	});

	const html = await renderVerifyEmail({
		...(username ? { username } : {}),
		verifyUrl: withToken(verifyEmailUrlBase(), token),
	});
	const result = await send("verify_email", to, "Verify your email address", html);
	return { ...result, token };
}

export async function sendVerifyEmailForUser(
	to: string,
	userId: number,
	username: string | null,
): Promise<EmailResult> {
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
		verifyUrl: withToken(verifyEmailUrlBase(), token),
	});
	return send("verify_email", to, "Verify your email address", html);
}

// ── Account deletion ─────────────────────────────────────────────────

export async function sendAccountDeletionConfirmEmail(
	to: string,
	userId: number,
	username: string | null,
): Promise<EmailResult> {
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
		confirmUrl: withToken(deletionConfirmUrlBase(), token),
	});
	return send("account_deletion_confirm", to, "Confirm account deletion", html);
}

export async function sendAccountDeletedEmail(to: string, props: AccountDeletedEmailProps): Promise<EmailResult> {
	const html = await renderAccountDeleted(props);
	return send("account_deleted", to, "Your ARSN account has been deleted", html);
}

export async function sendAccountDeletedAdminEmail(
	to: string,
	props: AccountDeletedAdminEmailProps,
): Promise<EmailResult> {
	const html = await renderAccountDeletedAdmin(props);
	return send("account_deleted_admin", to, "Your ARSN account has been deleted by an administrator", html);
}

// ── Account lock ─────────────────────────────────────────────────────

export async function sendAccountLockedEmail(to: string, props: AccountLockedEmailProps): Promise<EmailResult> {
	const html = await renderAccountLocked(props);
	return send("account_locked", to, "Your ARSN account has been locked", html);
}

export async function sendAccountLockedAdminEmail(
	to: string,
	props: AccountLockedAdminEmailProps,
): Promise<EmailResult> {
	const html = await renderAccountLockedAdmin(props);
	return send("account_locked_admin", to, "Your ARSN account has been locked by an administrator", html);
}

// ── Account suspended ────────────────────────────────────────────────

export async function sendAccountSuspendedEmail(to: string, props: AccountSuspendedEmailProps): Promise<EmailResult> {
	const html = await renderAccountSuspended(props);
	return send("account_suspended", to, "Your ARSN account has been suspended", html);
}
