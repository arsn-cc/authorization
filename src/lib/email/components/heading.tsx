import type { ReactNode } from "react";
import { Section, Heading } from "react-email";

export function HeadingBlock({ children }: { children: ReactNode }) {
	return (
		<Section className="mt-8">
			<Heading className="text-primary m-0 text-center text-2xl font-normal">{children}</Heading>
		</Section>
	);
}
