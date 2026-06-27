import { Button as EmailButton } from "react-email";
import type { ComponentPropsWithoutRef } from "react";

export function Button({ className, ...props }: ComponentPropsWithoutRef<typeof EmailButton>) {
	return (
		<EmailButton
			className={`bg-primary text-bg rounded-md px-5 py-2.5 text-center text-sm font-semibold no-underline ${className ?? ""}`}
			{...props}
		/>
	);
}
