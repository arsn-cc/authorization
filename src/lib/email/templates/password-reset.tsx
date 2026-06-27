import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { Button } from "@/lib/email/components/button";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

export interface PasswordResetEmailProps {
	username?: string;
	resetUrl?: string;
}

export default function PasswordResetEmail({
	username = isPreview ? preview.username : undefined,
	resetUrl = isPreview ? preview.resetUrl : undefined,
}: PasswordResetEmailProps) {
	return (
		<Layout preview="Reset your password">
			<HeadingBlock>Reset your password</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					A request has been made to reset the password for your account,{" "}
					{username ? <span className="text-primary">{username}</span> : "User"}. To proceed, please click the button
					below. This link will expire in one hour.
				</Text>
			</Section>
			<Section className="mt-6 text-center">
				<Button href={resetUrl ?? "#"}>Reset password</Button>
			</Section>
			<Section className="mt-6">
				<Text className="text-foreground m-0 text-sm leading-relaxed">
					If you did not request a password reset, no further action is required.
				</Text>
			</Section>
			<SignOff />
		</Layout>
	);
}
