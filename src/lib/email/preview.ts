export const isPreview = process.env.EMAIL_PREVIEW === "true";

export const preview = {
	username: "test",
	email: "test@example.com",
	newEmail: "test.new@example.com",
	verifyUrl: "#",
	revertUrl: "#",
	confirmUrl: "#",
	unlockUrl: "#",
	time: "Jun 27, 2026 at 14:32 UTC",
	ip: "203.0.113.42",
	location: "Sydney, NSW, Australia",
	timezone: "Australia/Sydney (AEST, UTC+10)",
	language: "en-AU",
	deviceType: "smartphone",
	os: "iOS 22",
	browser: "Safari",
	code: "482701",
} as const;
