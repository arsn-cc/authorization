import { getCache } from "@/lib/cache";

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	retryAfter: number;
}

interface Window {
	count: number;
	resetAt: number;
}

// Best-effort fixed-window rate limiter backed by the shared cache (Redis).
// Not atomic, but sufficient to blunt brute-force and abuse.
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<RateLimitResult> {
	const cache = await getCache();
	const windowKey = `ratelimit:${key}`;
	const now = Date.now();

	const existing = await cache.get<Window>(windowKey);
	let count: number;
	let resetAt: number;

	if (!existing || existing.resetAt <= now) {
		count = 1;
		resetAt = now + windowSeconds * 1000;
	} else {
		count = existing.count + 1;
		resetAt = existing.resetAt;
	}

	const ttl = Math.max(1, Math.ceil((resetAt - now) / 1000));
	await cache.set(windowKey, { count, resetAt }, ttl);

	const allowed = count <= max;
	const retryAfter = Math.max(0, Math.ceil((resetAt - now) / 1000));
	return {
		allowed,
		remaining: Math.max(0, max - count),
		retryAfter,
	};
}

// Best-effort client IP extraction from common proxy headers.
export function getClientIp(req: Request): string {
	const forwarded = req.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0]!.trim();
	}
	const realIp = req.headers.get("x-real-ip") ?? req.headers.get("cf-connecting-ip");
	if (realIp) {
		return realIp.trim();
	}
	return new URL(req.url).hostname;
}
