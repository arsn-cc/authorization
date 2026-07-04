export const isPreview = process.env.EMAIL_PREVIEW === "true";

export const preview = {
	username: "test",
	email: "test@example.com",
	newEmail: "test.new@example.com",
	token: "preview-token",
	pendingToken: "preview-pending-token",
	code: "482701",
	revertToken: "preview-revert-token",
	unlockToken: "preview-unlock-token",
	time: "Jun 27, 2026 at 14:32 UTC",
	ip: "203.0.113.42",
	location: "Sydney, NSW, Australia",
	timezone: "Australia/Sydney (AEST, UTC+10)",
	language: "en-AU",
	deviceType: "smartphone",
	os: "iOS 22",
	browser: "Safari",
} as const;
