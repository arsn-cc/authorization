import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

export interface WelcomeEmailProps {
	username?: string;
}

export default function WelcomeEmail({ username = isPreview ? preview.username : undefined }: WelcomeEmailProps) {
	return (
		<Layout preview="Your account has been created">
			<HeadingBlock>Welcome</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					Thank you for creating an account, {username ? <span className="text-primary">{username}</span> : "User"}.
					Your account has been registered successfully and is ready for use.
				</Text>
			</Section>
			<Section className="mt-6">
				<Text className="text-foreground m-0 text-sm leading-relaxed">
					If you did not initiate this registration, please disregard this message.
				</Text>
			</Section>
			<SignOff />
		</Layout>
	);
}
