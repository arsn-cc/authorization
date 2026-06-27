import { Link as EmailLink } from "react-email";
import type { ComponentPropsWithoutRef } from "react";

export function Link({ className, ...props }: ComponentPropsWithoutRef<typeof EmailLink>) {
	return <EmailLink className={`text-primary underline ${className ?? ""}`} {...props} />;
}
