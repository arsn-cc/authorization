import { render } from "react-email";
import WelcomeEmail from "./templates/welcome";
import PasswordResetEmail from "./templates/password-reset";
import PasswordChangedEmail from "./templates/password-changed";
import EmailChangedEmail from "./templates/email-changed";
import LoginNotificationEmail from "./templates/login-notification";
import AccountLockedEmail from "./templates/account-locked";
import TwoFactorEmail from "./templates/two-factor";
import VerifyEmail from "./templates/verify-email";
import AccountDeletionConfirmEmail from "./templates/account-deletion-confirm";
import AccountDeletedEmail from "./templates/account-deleted";
import AccountSuspendedEmail from "./templates/account-suspended";
import AccountDeletedAdminEmail from "./templates/account-deleted-admin";
import AccountLockedAdminEmail from "./templates/account-locked-admin";
import type { WelcomeEmailProps } from "./templates/welcome";
import type { PasswordResetEmailProps } from "./templates/password-reset";
import type { PasswordChangedEmailProps } from "./templates/password-changed";
import type { EmailChangedEmailProps } from "./templates/email-changed";
import type { LoginNotificationEmailProps } from "./templates/login-notification";
import type { AccountLockedEmailProps } from "./templates/account-locked";
import type { TwoFactorEmailProps } from "./templates/two-factor";
import type { VerifyEmailProps } from "./templates/verify-email";
import type { AccountDeletionConfirmEmailProps } from "./templates/account-deletion-confirm";
import type { AccountDeletedEmailProps } from "./templates/account-deleted";
import type { AccountSuspendedEmailProps } from "./templates/account-suspended";
import type { AccountDeletedAdminEmailProps } from "./templates/account-deleted-admin";
import type { AccountLockedAdminEmailProps } from "./templates/account-locked-admin";

export type {
	WelcomeEmailProps,
	PasswordResetEmailProps,
	PasswordChangedEmailProps,
	EmailChangedEmailProps,
	LoginNotificationEmailProps,
	AccountLockedEmailProps,
	TwoFactorEmailProps,
	VerifyEmailProps,
	AccountDeletionConfirmEmailProps,
	AccountDeletedEmailProps,
	AccountSuspendedEmailProps,
	AccountDeletedAdminEmailProps,
	AccountLockedAdminEmailProps,
};

export async function renderWelcome(props: WelcomeEmailProps) {
	return render(<WelcomeEmail {...props} />);
}

export async function renderPasswordReset(props: PasswordResetEmailProps) {
	return render(<PasswordResetEmail {...props} />);
}

export async function renderPasswordChanged(props: PasswordChangedEmailProps) {
	return render(<PasswordChangedEmail {...props} />);
}

export async function renderEmailChanged(props: EmailChangedEmailProps) {
	return render(<EmailChangedEmail {...props} />);
}

export async function renderLoginNotification(props: LoginNotificationEmailProps) {
	return render(<LoginNotificationEmail {...props} />);
}

export async function renderAccountLocked(props: AccountLockedEmailProps) {
	return render(<AccountLockedEmail {...props} />);
}

export async function renderTwoFactor(props: TwoFactorEmailProps) {
	return render(<TwoFactorEmail {...props} />);
}

export async function renderVerifyEmail(props: VerifyEmailProps) {
	return render(<VerifyEmail {...props} />);
}

export async function renderAccountDeletionConfirm(props: AccountDeletionConfirmEmailProps) {
	return render(<AccountDeletionConfirmEmail {...props} />);
}

export async function renderAccountDeleted(props: AccountDeletedEmailProps) {
	return render(<AccountDeletedEmail {...props} />);
}

export async function renderAccountSuspended(props: AccountSuspendedEmailProps) {
	return render(<AccountSuspendedEmail {...props} />);
}

export async function renderAccountDeletedAdmin(props: AccountDeletedAdminEmailProps) {
	return render(<AccountDeletedAdminEmail {...props} />);
}

export async function renderAccountLockedAdmin(props: AccountLockedAdminEmailProps) {
	return render(<AccountLockedAdminEmail {...props} />);
}
