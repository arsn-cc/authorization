import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { Link } from "@/lib/email/components/link";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

export interface AccountLockedEmailProps {
	username?: string;
}

export default function AccountLockedEmail({
	username = isPreview ? preview.username : undefined,
}: AccountLockedEmailProps) {
	return (
		<Layout preview="Your account has been locked">
			<HeadingBlock>Account locked</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					Your account, {username ? <span className="text-primary">{username}</span> : "User"} has been temporarily
					locked due to multiple failed sign-in attempts. This measure is in place to protect your account from
					unauthorised access.
				</Text>
			</Section>
			<Section className="mt-6">
				<Text className="text-foreground m-0 text-sm leading-relaxed">
					If you did not attempt to sign in, please reset your password immediately and contact{" "}
					<Link href="mailto:security@arsn.cc">security@arsn.cc</Link>.
				</Text>
			</Section>
			<SignOff />
		</Layout>
	);
}
