import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

export interface TwoFactorEmailProps {
	username?: string;
	code?: string;
}

export default function TwoFactorEmail({
	username = isPreview ? preview.username : undefined,
	code = isPreview ? preview.code : undefined,
}: TwoFactorEmailProps) {
	return (
		<Layout preview="Your verification code">
			<HeadingBlock>Verification code</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					Please use the following verification code to complete your sign-in,{" "}
					{username ? <span className="text-primary">{username}</span> : "User"}:
				</Text>
			</Section>
			<Section className="mt-6 text-center">
				<Text className="bg-card text-primary mx-auto inline-block rounded-md px-6 py-3 text-3xl font-bold tracking-widest">
					{code}
				</Text>
			</Section>
			<Section className="mt-6">
				<Text className="text-foreground m-0 text-sm leading-relaxed">
					This code will expire in 10 minutes. If you did not attempt to sign in, please ignore this email.
				</Text>
			</Section>
			<SignOff />
		</Layout>
	);
}
