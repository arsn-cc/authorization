import { render } from "react-email";
import WelcomeEmail, { type WelcomeEmailProps } from "./templates/welcome";
import PasswordResetEmail, { type PasswordResetEmailProps } from "./templates/password-reset";
import LoginNotificationEmail, { type LoginNotificationEmailProps } from "./templates/login-notification";
import TwoFactorEmail, { type TwoFactorEmailProps } from "./templates/two-factor";

export async function renderWelcome(props: WelcomeEmailProps) {
	return render(<WelcomeEmail {...props} />);
}

export async function renderPasswordReset(props: PasswordResetEmailProps) {
	return render(<PasswordResetEmail {...props} />);
}

export async function renderLoginNotification(props: LoginNotificationEmailProps) {
	return render(<LoginNotificationEmail {...props} />);
}

export async function renderTwoFactor(props: TwoFactorEmailProps) {
	return render(<TwoFactorEmail {...props} />);
}
