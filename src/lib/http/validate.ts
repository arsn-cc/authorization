import { z } from "zod";
import { withSecurityHeaders } from "./response";

export async function parseJsonSafe<T>(request: Request, schema: z.ZodSchema<T>): Promise<T | Response> {
	try {
		const raw = await request.json();
		return schema.parse(raw);
	} catch (e) {
		if (e instanceof z.ZodError) {
			return withSecurityHeaders(
				Response.json(
					{
						error: "validation_error",
						details: e.issues.map((i) => ({
							path: i.path.join("."),
							message: i.message,
						})),
					},
					{ status: 400 },
				),
			);
		}
		return withSecurityHeaders(Response.json({ error: "invalid_json" }, { status: 400 }));
	}
}

export async function parseFormSafe<T>(request: Request, schema: z.ZodSchema<T>): Promise<T | Response> {
	try {
		const form = await request.formData();
		const raw: Record<string, string> = {};
		for (const [key, value] of form.entries()) {
			if (typeof value === "string") {
				raw[key] = value;
			}
		}
		return schema.parse(raw);
	} catch (e) {
		if (e instanceof z.ZodError) {
			return withSecurityHeaders(
				Response.json(
					{
						error: "validation_error",
						details: e.issues.map((i) => ({
							path: i.path.join("."),
							message: i.message,
						})),
					},
					{ status: 400 },
				),
			);
		}
		return withSecurityHeaders(Response.json({ error: "invalid_form" }, { status: 400 }));
	}
}

export function parseQuery(
	url: URL,
	schema: z.ZodSchema<Record<string, string | undefined>>,
): Record<string, string | undefined> {
	const raw: Record<string, string | undefined> = {};
	for (const [key, value] of url.searchParams.entries()) {
		raw[key] = value;
	}
	return schema.parse(raw);
}
