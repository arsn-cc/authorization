import type { ReactNode } from "react";
import { Html, Head, Preview, Body, Container, Section, Row, Column, Tailwind } from "react-email";

interface LayoutProps {
	preview: string;
	children: ReactNode;
}

export function Layout({ preview, children }: LayoutProps) {
	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Tailwind
				config={{
					theme: {
						extend: {
							colors: {
								bg: "#18181b",
								card: "#27272a",
								foreground: "#fafafa",
								primary: "#22c55e",
								muted: "#a1a1aa",
								border: "#3f3f46",
							},
						},
					},
				}}
			>
				<Body className="bg-bg font-sans">
					<Section style={{ minHeight: "100dvh" }}>
						<Row>
							<Column align="center" style={{ verticalAlign: "middle" }}>
								<Container className="max-w-[465px]">
									<Section className="text-center">{children}</Section>
								</Container>
							</Column>
						</Row>
					</Section>
				</Body>
			</Tailwind>
		</Html>
	);
}
