import { withSecurityHeaders } from "@/lib/http/response";
import { validateServiceTicket, createServiceResponse, createServiceFailureResponse } from "@/lib/cas";
import { parseFormSafe } from "@/lib/http/validate";
import { casSamlValidateSchema } from "@/lib/schemas/cas";

export async function POST(req: Request): Promise<Response> {
	const parsed = await parseFormSafe(req, casSamlValidateSchema);
	if (parsed instanceof Response) {
		return parsed;
	}

	const result = await validateServiceTicket(parsed.ticket, parsed.service);
	if (!result) {
		const xml = createServiceFailureResponse("INVALID_TICKET", "Ticket validation failed");
		return withSecurityHeaders(
			new Response(xml, {
				status: 200,
				headers: { "content-type": "text/xml; charset=utf-8" },
			}),
		);
	}

	const xml = createServiceResponse(result);
	return withSecurityHeaders(
		new Response(xml, {
			status: 200,
			headers: { "content-type": "text/xml; charset=utf-8" },
		}),
	);
}
