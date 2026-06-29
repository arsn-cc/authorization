import { searchUsers, searchGroups, getDefaultServerConfig } from "@/lib/ldap";

export async function POST(_req: Request): Promise<Response> {
	const body = (await _req.json()) as Record<string, unknown>;
	const baseDn = (body.base_dn as string) ?? "";
	const filter = (body.filter as string) ?? "";

	const config = getDefaultServerConfig();

	try {
		let entries;
		if (baseDn.toLowerCase().includes("ou=groups") || filter.toLowerCase().includes("objectclass=group")) {
			entries = await searchGroups(config.domain);
		} else {
			entries = await searchUsers(config.domain);
		}

		return Response.json({
			totalResults: entries.length,
			entries,
		});
	} catch (e) {
		return Response.json({ error: e instanceof Error ? e.message : "search_failed" }, { status: 500 });
	}
}
