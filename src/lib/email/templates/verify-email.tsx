import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { Button } from "@/lib/email/components/button";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

const base = () => process.env.APP_URL ?? "https://auth.arsn.cc";
const verifyUrl = (token: string) => `${base()}/verify-email?token=${encodeURIComponent(token)}`;

export interface VerifyEmailProps {
	username?: string;
	token?: string;
}

export default function VerifyEmail({
	username = isPreview ? preview.username : undefined,
	token = isPreview ? preview.token : undefined,
}: VerifyEmailProps) {
	return (
		<Layout preview="Verify your email address">
			<HeadingBlock>Verify your email</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					Welcome
					{username ? (
						<>
							, <span className="text-primary">{username}</span>
						</>
					) : (
						""
					)}
					! Please verify your email address by clicking the button below. This link will expire in one hour.
				</Text>
			</Section>
			<Section className="mt-6 text-center">
				<Button href={token ? verifyUrl(token) : "#"}>Verify email</Button>
			</Section>
			<Section className="mt-6">
				<Text className="text-foreground m-0 text-sm leading-relaxed">
					If you did not create an account, please disregard this message.
				</Text>
			</Section>
			<SignOff />
		</Layout>
	);
}
