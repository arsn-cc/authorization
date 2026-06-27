import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { Link } from "@/lib/email/components/link";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

export interface PasswordChangedEmailProps {
	username?: string;
}

export default function PasswordChangedEmail({
	username = isPreview ? preview.username : undefined,
}: PasswordChangedEmailProps) {
	return (
		<Layout preview="Your password has been changed">
			<HeadingBlock>Password changed</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					The password for your account, {username ? <span className="text-primary">{username}</span> : "User"} has been
					changed successfully.
				</Text>
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					If you did not initiate this change, please contact{" "}
					<Link href="mailto:security@arsn.cc">security@arsn.cc</Link> immediately and reset your credentials.
				</Text>
			</Section>
			<SignOff />
		</Layout>
	);
}
