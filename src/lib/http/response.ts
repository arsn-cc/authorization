const SECURITY_HEADERS: Record<string, string> = {
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
