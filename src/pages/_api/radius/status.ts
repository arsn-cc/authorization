export async function GET(): Promise<Response> {
	return Response.json({
		status: "ok",
		version: "1.0.0",
		protocols: ["RADIUS"],
	});
}
