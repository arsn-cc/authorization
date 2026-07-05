import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { Link } from "@/lib/email/components/link";
import { Button } from "@/lib/email/components/button";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

const base = () => process.env.APP_URL ?? "https://auth.arsn.cc";
const revertUrl = (token: string) => `${base()}/revert-email?token=${encodeURIComponent(token)}`;

export interface EmailChangedEmailProps {
	username?: string;
	newEmail?: string;
	revertToken?: string;
}

export default function EmailChangedEmail({
	username = isPreview ? preview.username : undefined,
	newEmail = isPreview ? preview.newEmail : undefined,
	revertToken = isPreview ? preview.revertToken : undefined,
}: EmailChangedEmailProps) {
	return (
		<Layout preview="Your email address has been changed">
			<HeadingBlock>Email address changed</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					The email address for your account, {username ? <span className="text-primary">{username}</span> : "User"} has
					been changed to <strong>{newEmail}</strong>.
				</Text>
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					If you did not request this change, use the button below to revert to your previous email address. This link
					will expire in one hour.
				</Text>
			</Section>
			{revertToken && (
				<Section className="mt-6 text-center">
					<Button href={revertUrl(revertToken)}>Revert change</Button>
				</Section>
			)}
			<Section className="mt-6">
				<Text className="text-foreground m-0 text-sm leading-relaxed">
					If you cannot revert this change, please contact <Link href="mailto:security@arsn.cc">security@arsn.cc</Link>{" "}
					immediately.
				</Text>
			</Section>
			<SignOff />
		</Layout>
	);
}
