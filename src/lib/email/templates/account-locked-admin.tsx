import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { Button } from "@/lib/email/components/button";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

export interface AccountLockedAdminEmailProps {
	username?: string;
	reason?: string;
	unlockUrl?: string;
}

export default function AccountLockedAdminEmail({
	username = isPreview ? preview.username : undefined,
	reason,
	unlockUrl = isPreview ? preview.unlockUrl : undefined,
}: AccountLockedAdminEmailProps) {
	return (
		<Layout preview="Your account has been locked by an administrator">
			<HeadingBlock>Account locked</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					The account for {username ? <span className="text-primary">{username}</span> : "User"} has been locked by an
					administrator.
				</Text>
				{reason && <Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">Reason: {reason}</Text>}
			</Section>
			{unlockUrl && (
				<Section className="mt-6 text-center">
					<Button href={unlockUrl}>Unlock account</Button>
				</Section>
			)}
			<SignOff />
		</Layout>
	);
}
