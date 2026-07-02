export const SECURITY_HEADERS: Record<string, string> = {
	"x-content-type-options": "nosniff",
	"x-frame-options": "DENY",
	"x-xss-protection": "0",
	"referrer-policy": "strict-origin-when-cross-origin",
};

export function withSecurityHeaders(response: Response): Response {
	if (response.headers.has("x-content-type-options")) {
		return response;
	}
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}
	return response;
}

export function securityHeadersInit(): HeadersInit {
	return { ...SECURITY_HEADERS };
}

export function secureJson(data: unknown, init?: ResponseInit): Response {
	return withSecurityHeaders(Response.json(data, init));
}

export function secureRedirect(location: string, status = 302): Response {
	return withSecurityHeaders(new Response(null, { status, headers: { Location: location } }));
}
