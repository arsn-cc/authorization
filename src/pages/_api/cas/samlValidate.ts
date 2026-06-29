import { validateServiceTicket, createServiceResponse, createServiceFailureResponse } from "@/lib/cas";

export async function POST(req: Request): Promise<Response> {
	const form = await req.formData();
	const ticket = form.get("ticket") as string;
	const service = form.get("service") as string;
	const _saml = form.get("SAMLart") as string | null;

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
