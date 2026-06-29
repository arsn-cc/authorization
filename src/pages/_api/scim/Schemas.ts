import { getScimSchemas } from "@/lib/scim";

export async function GET(): Promise<Response> {
	return Response.json(getScimSchemas());
}
