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

const IMAGE_MAGIC_BYTES: { mime: string; sig: number[] }[] = [
	{ mime: "image/jpeg", sig: [0xff, 0xd8, 0xff] },
	{ mime: "image/png", sig: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
	{ mime: "image/gif", sig: [0x47, 0x49, 0x46, 0x38] },
];

const WEBP_SIG = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WEBP_SUB = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
const AVIF_FTYP = [0x66, 0x74, 0x79, 0x70]; // "ftyp"
const AVIF_BRAND = [0x61, 0x76, 0x69, 0x66]; // "avif"

export function validateImageHeader(bytes: Uint8Array, mime: string): boolean {
	for (const fmt of IMAGE_MAGIC_BYTES) {
		if (fmt.mime === mime) {
			return fmt.sig.every((b, i) => bytes[i] === b);
		}
	}

	if (mime === "image/webp") {
		if (bytes.length < 12) {
			return false;
		}
		return WEBP_SIG.every((b, i) => bytes[i] === b) && WEBP_SUB.every((b, i) => bytes[i + 8] === b);
	}

	if (mime === "image/avif") {
		if (bytes.length < 12) {
			return false;
		}
		return (
			bytes[4] === 0x20 &&
			AVIF_FTYP.every((b, i) => bytes[i + 4] === b) &&
			AVIF_BRAND.every((b, i) => bytes[i + 8] === b)
		);
	}

	return false;
}
