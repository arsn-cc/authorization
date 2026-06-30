import { createUser, updateUser, deleteUser, createGroup, deleteGroup } from "@/lib/scim";
import { requirePermission, AdminPermission } from "@/pages/_api/admin/auth";

function parseId(path: string): number | null {
	const segment = path.split("/")[2];
	const id = Number(segment);
	return Number.isFinite(id) && Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(req: Request): Promise<Response> {
	const result = await requirePermission(req, AdminPermission.UsersWrite);
	if (result instanceof Response) {
		return result;
	}

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
				const id = parseId(op.path);
				if (!id) {
					results.push({ method: "PUT", status: 400, code: "invalid_path" });
					continue;
				}
				const user = await updateUser(id, op.data ?? {});
				results.push({ method: "PUT", status: 200, response: user });
			} else if (op.method === "PATCH" && op.path.startsWith("/Users/")) {
				const id = parseId(op.path);
				if (!id) {
					results.push({ method: "PATCH", status: 400, code: "invalid_path" });
					continue;
				}
				const user = await updateUser(id, op.data ?? {});
				results.push({ method: "PATCH", status: 200, response: user });
			} else if (op.method === "DELETE" && op.path.startsWith("/Users/")) {
				const id = parseId(op.path);
				if (!id) {
					results.push({ method: "DELETE", status: 400, code: "invalid_path" });
					continue;
				}
				await deleteUser(id);
				results.push({ method: "DELETE", status: 204 });
			} else if (op.method === "DELETE" && op.path.startsWith("/Groups/")) {
				const id = parseId(op.path);
				if (!id) {
					results.push({ method: "DELETE", status: 400, code: "invalid_path" });
					continue;
				}
				await deleteGroup(id);
				results.push({ method: "DELETE", status: 204 });
			} else {
				results.push({ method: op.method, status: 501, code: "not_implemented" });
			}
		} catch {
			results.push({
				method: op.method,
				status: 500,
				code: "internal_error",
			});
		}
	}

	return Response.json({
		schemas: ["urn:ietf:params:scim:api:messages:2.0:BulkResponse"],
		Operations: results,
	});
}
