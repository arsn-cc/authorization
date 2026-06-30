import { eq } from "drizzle-orm";
import { getClientById, generateAuthorizationCode, type AuthorizationRequest } from "@/lib/oauth";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { parseCookie, SESSION_COOKIE_NAME } from "@/lib/auth/utils";

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const responseType = url.searchParams.get("response_type");
	const clientId = url.searchParams.get("client_id");
	const redirectUri = url.searchParams.get("redirect_uri");
	const scope = url.searchParams.get("scope") ?? "openid";
	const stateParam = url.searchParams.get("state");
	const codeChallengeParam = url.searchParams.get("code_challenge");
	const codeChallengeMethodParam = url.searchParams.get(
		"code_challenge_method",
	) as AuthorizationRequest["codeChallengeMethod"];
	const nonceParam = url.searchParams.get("nonce");

	if (responseType !== "code") {
		return Response.json(
			{ error: "unsupported_response_type" },
			{ status: 400, headers: { "content-type": "application/json" } },
		);
	}

	if (!clientId || !redirectUri) {
		return Response.json(
			{ error: "invalid_request" },
			{ status: 400, headers: { "content-type": "application/json" } },
		);
	}

	const client = await getClientById(clientId);
	if (!client) {
		return Response.json(
			{ error: "unauthorized_client" },
			{ status: 400, headers: { "content-type": "application/json" } },
		);
	}

	if (
		!client.redirectUris
			?.split(",")
			.map((u) => u.trim())
			.includes(redirectUri)
	) {
		return Response.json(
			{ error: "invalid_redirect_uri" },
			{ status: 400, headers: { "content-type": "application/json" } },
		);
	}

	if (scope && !scope.split(" ").every((s) => client.scopes.split(" ").includes(s))) {
		const dest = new URL(redirectUri);
		dest.searchParams.set("error", "invalid_scope");
		if (stateParam) {
			dest.searchParams.set("state", stateParam);
		}
		return new Response(null, { status: 302, headers: { Location: dest.toString() } });
	}

	const prompt = url.searchParams.get("prompt");
	const maxAge = url.searchParams.get("max_age");

	const cookie = req.headers.get("cookie") ?? "";
	const token = parseCookie(cookie, SESSION_COOKIE_NAME);

	let sessionUserId: number | null = null;
	let sessionIdVal: number | null = null;

	if (token) {
		const session = await getSession(token);
		if (session.success && session.data) {
			sessionUserId = session.data.userId;
			sessionIdVal = session.data.sessionId;
		}
	}

	if (prompt === "none" && !sessionUserId) {
		const dest = new URL(redirectUri);
		dest.searchParams.set("error", "login_required");
		if (stateParam) {
			dest.searchParams.set("state", stateParam);
		}
		return new Response(null, { status: 302, headers: { Location: dest.toString() } });
	}

	if (!sessionUserId || prompt === "login") {
		const loginUrl = new URL("/login", url.origin);
		loginUrl.searchParams.set("redirect", url.pathname + url.search);
		return new Response(null, { status: 302, headers: { Location: loginUrl.toString() } });
	}

	if (maxAge && sessionIdVal) {
		const db = await getDb();
		const [sessionRow] = await db
			.select({ createdAt: schema.session.createdAt })
			.from(schema.session)
			.where(eq(schema.session.id, sessionIdVal))
			.limit(1);
		if (sessionRow && Date.now() - sessionRow.createdAt.getTime() > parseInt(maxAge, 10) * 1000) {
			const loginUrl = new URL("/login", url.origin);
			loginUrl.searchParams.set("redirect", url.pathname + url.search);
			return new Response(null, { status: 302, headers: { Location: loginUrl.toString() } });
		}
	}

	const authRequest: AuthorizationRequest = {
		responseType: "code",
		clientId,
		redirectUri,
		scope,
		...(stateParam ? { state: stateParam } : {}),
		...(codeChallengeParam ? { codeChallenge: codeChallengeParam } : {}),
		...(codeChallengeMethodParam ? { codeChallengeMethod: codeChallengeMethodParam } : {}),
		...(nonceParam ? { nonce: nonceParam } : {}),
	};

	const code = await generateAuthorizationCode(authRequest, sessionUserId, sessionIdVal ?? undefined);

	const dest = new URL(redirectUri);
	dest.searchParams.set("code", code);
	if (stateParam) {
		dest.searchParams.set("state", stateParam);
	}

	return new Response(null, { status: 302, headers: { Location: dest.toString() } });
}
