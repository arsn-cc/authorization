import { createUser, updateUser, deleteUser, createGroup, deleteGroup } from "@/lib/scim";

export async function POST(req: Request): Promise<Response> {
	const body = (await req.json()) as {
		schemas?: string[];
		Operations?: Array<{
			method: "POST" | "PUT" | "PATCH" | "DELETE";
			path: string;
			data?: Record<string, unknown>;
		}>;
		failOnErrors?: number;
	};

	const ops = body.Operations ?? [];
	const results: Array<{ location?: string; method: string; status: number; response?: unknown; code?: string }> = [];

	for (const op of ops) {
		try {
			if (op.method === "POST" && op.path.startsWith("/Users")) {
				const user = await createUser(op.data ?? {});
				results.push({ method: "POST", status: 201, location: `/scim/Users/${user.id}`, response: user });
			} else if (op.method === "POST" && op.path.startsWith("/Groups")) {
				const group = await createGroup(op.data ?? {});
				results.push({ method: "POST", status: 201, location: `/scim/Groups/${group.id}`, response: group });
			} else if (op.method === "PUT" && op.path.startsWith("/Users/")) {
				const id = Number(op.path.split("/")[2]);
				const user = await updateUser(id, op.data ?? {});
				results.push({ method: "PUT", status: 200, response: user });
			} else if (op.method === "PATCH" && op.path.startsWith("/Users/")) {
				const id = Number(op.path.split("/")[2]);
				const user = await updateUser(id, op.data ?? {});
				results.push({ method: "PATCH", status: 200, response: user });
			} else if (op.method === "DELETE" && op.path.startsWith("/Users/")) {
				const id = Number(op.path.split("/")[2]);
				await deleteUser(id);
				results.push({ method: "DELETE", status: 204 });
			} else if (op.method === "DELETE" && op.path.startsWith("/Groups/")) {
				const id = Number(op.path.split("/")[2]);
				await deleteGroup(id);
				results.push({ method: "DELETE", status: 204 });
			} else {
				results.push({ method: op.method, status: 501, code: "not_implemented" });
			}
		} catch (e) {
			results.push({
				method: op.method,
				status: 400,
				code: "error",
				response: { detail: e instanceof Error ? e.message : "unknown" },
			});
		}
	}

	return Response.json({
		schemas: ["urn:ietf:params:scim:api:messages:2.0:BulkResponse"],
		Operations: results,
	});
}
