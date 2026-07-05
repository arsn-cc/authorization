import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { Link } from "@/lib/email/components/link";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

export interface AccountDeletedAdminEmailProps {
	username?: string;
	reason?: string;
}

export default function AccountDeletedAdminEmail({
	username = isPreview ? preview.username : undefined,
	reason,
}: AccountDeletedAdminEmailProps) {
	return (
		<Layout preview="Your account has been deleted by an administrator">
			<HeadingBlock>Account deleted</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					The account for {username ? <span className="text-primary">{username}</span> : "User"} has been deleted by an
					administrator. All associated data has been permanently removed.
				</Text>
				{reason && <Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">Reason: {reason}</Text>}
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					If you believe this was done in error, please contact{" "}
					<Link href="mailto:security@example.com">security@example.com</Link>.
				</Text>
			</Section>
			<SignOff />
		</Layout>
	);
}
