import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { Button } from "@/lib/email/components/button";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

export interface TwoFactorEmailProps {
	username?: string;
	verifyUrl?: string;
	code?: string;
}

export default function TwoFactorEmail({
	username = isPreview ? preview.username : undefined,
	verifyUrl = isPreview ? preview.twoFactorUrl : undefined,
	code = isPreview ? preview.code : undefined,
}: TwoFactorEmailProps) {
	return (
		<Layout preview="Verify your sign-in">
			<HeadingBlock>Verify your sign-in</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					Please click the button below or enter the code manually to complete your sign-in,{" "}
					{username ? <span className="text-primary">{username}</span> : "User"}.
				</Text>
			</Section>
			<Section className="mt-6 text-center">
				<Button href={verifyUrl ?? "#"}>Verify sign-in</Button>
			</Section>
			{code && (
				<Section className="mt-6 text-center">
					<Text className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">Or enter this code</Text>
					<Text className="text-foreground m-0 font-mono text-2xl tracking-widest">{code}</Text>
				</Section>
			)}
			<Section className="mt-6">
				<Text className="text-foreground m-0 text-sm leading-relaxed">
					This code will expire in 10 minutes. If you did not attempt to sign in, please ignore this email.
				</Text>
			</Section>
			<SignOff />
		</Layout>
	);
}
