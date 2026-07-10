const SECURITY_HEADERS: Record<string, string> = {
	"content-security-policy":
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
	"strict-transport-security": "max-age=63072000; includeSubDomains",
	"x-content-type-options": "nosniff",
	"x-frame-options": "DENY",
	"x-xss-protection": "0",
	"referrer-policy": "strict-origin-when-cross-origin",
};

// Cross-origin access is restricted to an explicit allowlist. Set CORS_ALLOW_ORIGIN
// to a single origin (e.g. "https://app.example.com") to enable browser CORS.
// When unset, no Access-Control-Allow-Origin header is emitted, which is the
// safe default: same-origin requests and server-to-server (no CORS) calls are
// unaffected, while arbitrary cross-origin reads of API responses are blocked.
const ALLOWED_ORIGIN = process.env.CORS_ALLOW_ORIGIN;

function applyCors(response: Response): void {
	if (!ALLOWED_ORIGIN) {
		return;
	}
	response.headers.set("access-control-allow-origin", ALLOWED_ORIGIN);
	response.headers.set("vary", "Origin");
}

export function withSecurityHeaders(response: Response): Response {
	if (response.headers.has("x-content-type-options")) {
		return response;
	}
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}
	applyCors(response);
	return response;
}
