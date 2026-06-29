import { validateServiceTicket, createServiceResponse, createServiceFailureResponse } from "@/lib/cas";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const ticket = url.searchParams.get("ticket");
	const service = url.searchParams.get("service");

	if (!ticket || !service) {
		const xml = createServiceFailureResponse("INVALID_REQUEST", "Missing ticket or service parameter");
		return new Response(xml, {
			status: 200,
			headers: { "content-type": "text/xml; charset=utf-8" },
		});
	}

	const result = await validateServiceTicket(ticket, service);
	if (!result) {
		const xml = createServiceFailureResponse("INVALID_TICKET", "Ticket validation failed");
		return new Response(xml, {
			status: 200,
			headers: { "content-type": "text/xml; charset=utf-8" },
		});
	}

	const xml = createServiceResponse(result);
	return new Response(xml, {
		status: 200,
		headers: { "content-type": "text/xml; charset=utf-8" },
	});
}
