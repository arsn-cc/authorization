import { render } from "react-email";
import WelcomeEmail, { type WelcomeEmailProps } from "./templates/welcome";
import PasswordResetEmail, { type PasswordResetEmailProps } from "./templates/password-reset";
import PasswordChangedEmail, { type PasswordChangedEmailProps } from "./templates/password-changed";
import LoginNotificationEmail, { type LoginNotificationEmailProps } from "./templates/login-notification";
import AccountLockedEmail, { type AccountLockedEmailProps } from "./templates/account-locked";
import TwoFactorEmail, { type TwoFactorEmailProps } from "./templates/two-factor";
import VerifyEmail, { type VerifyEmailProps } from "./templates/verify-email";
import AccountDeletionConfirmEmail, {
	type AccountDeletionConfirmEmailProps,
} from "./templates/account-deletion-confirm";
import AccountDeletedEmail, { type AccountDeletedEmailProps } from "./templates/account-deleted";
import AccountSuspendedEmail, { type AccountSuspendedEmailProps } from "./templates/account-suspended";
import AccountDeletedAdminEmail, { type AccountDeletedAdminEmailProps } from "./templates/account-deleted-admin";
import AccountLockedAdminEmail, { type AccountLockedAdminEmailProps } from "./templates/account-locked-admin";

export type {
	WelcomeEmailProps,
	PasswordResetEmailProps,
	PasswordChangedEmailProps,
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
