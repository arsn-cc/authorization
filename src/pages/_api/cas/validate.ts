import { withSecurityHeaders } from "@/lib/http/response";
import { validateServiceTicket, createServiceResponse, createServiceFailureResponse } from "@/lib/cas";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const ticket = url.searchParams.get("ticket");
	const service = url.searchParams.get("service");

	if (!ticket || !service) {
		const xml = createServiceFailureResponse("INVALID_REQUEST", "Missing ticket or service parameter");
		return withSecurityHeaders(
			new Response(xml, {
				status: 200,
				headers: { "content-type": "text/xml; charset=utf-8" },
			}),
		);
	}

	const result = await validateServiceTicket(ticket, service);
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
