import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { Link } from "@/lib/email/components/link";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

export interface AccountSuspendedEmailProps {
	username?: string;
	reason?: string;
}

export default function AccountSuspendedEmail({
	username = isPreview ? preview.username : undefined,
	reason,
}: AccountSuspendedEmailProps) {
	return (
		<Layout preview="Your account has been suspended">
			<HeadingBlock>Account suspended</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					The account for {username ? <span className="text-primary">{username}</span> : "User"} has been suspended by
					an administrator.
				</Text>
				{reason && <Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">Reason: {reason}</Text>}
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					If you believe this was done in error, please contact{" "}
					<Link href="mailto:security@arsn.cc">security@arsn.cc</Link>.
				</Text>
			</Section>
			<SignOff />
		</Layout>
	);
}
