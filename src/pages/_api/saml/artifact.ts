export async function GET(): Promise<Response> {
	return Response.json({ error: "not_implemented" }, { status: 501 });
}
