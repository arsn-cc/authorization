import { Section, Text } from "react-email";
import { Layout } from "@/lib/email/components/layout";
import { Link } from "@/lib/email/components/link";
import { HeadingBlock } from "@/lib/email/components/heading";
import { SignOff } from "@/lib/email/components/sign-off";
import { isPreview, preview } from "@/lib/email/preview";
import { sessionDisplayFields } from "@/lib/db/schema";
import type { SessionDisplayKeys } from "@/lib/db/schema";

export type LoginNotificationEmailProps = {
	username?: string;
	email?: string;
	time?: string;
} & { [K in SessionDisplayKeys]?: string };

function Row({ label, value }: { label: string; value: string }) {
	return (
		<tr>
			<td className="text-muted align-top text-sm" style={{ width: "40%", textAlign: "left" }}>
				{label}
			</td>
			<td
				className="text-foreground align-top text-sm"
				style={{ width: "60%", textAlign: "right", wordBreak: "break-word" }}
			>
				{value}
			</td>
		</tr>
	);
}

export default function LoginNotificationEmail({
	username = isPreview ? preview.username : undefined,
	email: _email,
	time: _time,
	...rest
}: LoginNotificationEmailProps) {
	const email = _email ?? (isPreview ? preview.email : undefined);
	const time = _time ?? (isPreview ? preview.time : undefined);

	const fields: { label: string; value: string | undefined }[] = [
		{ label: "Account", value: email },
		{ label: "Time", value: time },
		...sessionDisplayFields
			.map((f) => ({
				label: f.label,
				value: rest[f.key] ?? (isPreview ? preview[f.key as keyof typeof preview] : undefined),
			}))
			.filter((f) => f.value !== undefined),
	];

	return (
		<Layout preview="New sign-in to your account">
			<HeadingBlock>New sign-in, {username ? <span className="text-primary">{username}</span> : "User"}</HeadingBlock>

			<Section className="mt-6">
				<Text className="text-foreground mt-4 mb-0 text-sm leading-relaxed">
					A new sign-in to your account was detected from an unrecognised device.
				</Text>
			</Section>

			<Section className="bg-card border-l-primary mt-3 overflow-hidden rounded-md border-l-4 p-3">
				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
						tableLayout: "fixed",
					}}
				>
					<tbody>{fields.map((f) => f.value && <Row key={f.label} label={f.label} value={f.value} />)}</tbody>
				</table>
			</Section>

			<Section className="mt-6">
				<Text className="text-foreground m-0 text-sm leading-relaxed">
					If this wasn't you, please reset your password immediately and contact{" "}
					<Link href="mailto:security@arsn.cc">security@arsn.cc</Link>.
				</Text>
			</Section>

			<SignOff />
		</Layout>
	);
}
