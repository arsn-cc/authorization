import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { Button } from "@/lib/email/components/button";
import { Link } from "@/lib/email/components/link";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";

const base = () => process.env.APP_URL ?? "https://auth.arsn.cc";
const confirmUrl = (token: string) => `${base()}/delete-account?token=${encodeURIComponent(token)}`;

export interface AccountDeletionConfirmEmailProps {
	username?: string;
	token?: string;
}

export default function AccountDeletionConfirmEmail({
	username = isPreview ? preview.username : undefined,
	token = isPreview ? preview.token : undefined,
}: AccountDeletionConfirmEmailProps) {
	return (
		<Layout preview="Confirm account deletion">
			<HeadingBlock>Account deletion requested</HeadingBlock>
			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					A request has been received to delete the account for{" "}
					{username ? <span className="text-primary">{username}</span> : "User"}. If you made this request, confirm by
					clicking the button below. This action cannot be undone.
				</Text>
			</Section>
			{token && (
				<Section className="mt-6 text-center">
					<Button href={confirmUrl(token)} className="bg-red-800">
						Confirm deletion
					</Button>
				</Section>
			)}
			<Section className="mt-6">
				<Text className="text-foreground m-0 text-sm leading-relaxed">
					If you did not request account deletion, please contact{" "}
					<Link href="mailto:security@arsn.cc">security@arsn.cc</Link> immediately.
				</Text>
			</Section>
			<SignOff />
		</Layout>
	);
}
