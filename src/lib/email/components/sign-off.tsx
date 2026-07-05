import { Section, Text } from "react-email";

export function SignOff() {
	return (
		<Section className="mt-8">
			<Text className="text-foreground m-0 text-right text-sm leading-relaxed">
				Best regards,
				<br />
				the <strong className="text-primary">arsn</strong> team
			</Text>
		</Section>
	);
}
