import { z } from "zod";

export const loginSchema = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
});

export const totpVerifySchema = z.object({
	code: z.string().min(1),
});

export const emailTwoFactorSchema = z.object({
	token: z.string().min(1),
});

export const passwordChangeSchema = z.object({
	currentPassword: z.string().min(1),
	newPassword: z.string().min(8),
});

export const profileUpdateSchema = z.object({
	name: z.string().nullable().optional(),
	givenName: z.string().nullable().optional(),
	familyName: z.string().nullable().optional(),
	displayName: z.string().nullable().optional(),
	nickname: z.string().nullable().optional(),
	image: z.string().nullable().optional(),
	phoneNumber: z.string().nullable().optional(),
	profileUrl: z.string().nullable().optional(),
	websiteUrl: z.string().nullable().optional(),
	address: z.string().nullable().optional(),
	externalId: z.string().nullable().optional(),
	preferredLanguage: z.string().nullable().optional(),
	locale: z.string().nullable().optional(),
	timezone: z.string().nullable().optional(),
	loginShell: z.string().nullable().optional(),
	gecos: z.string().nullable().optional(),
});

export const setSessionSchema = z.object({
	token: z.string().min(1),
	expires: z.string().min(1).optional(),
});

export const ldapBindSchema = z.object({
	username: z.string().optional(),
	password: z.string().min(1),
	dn: z.string().optional(),
});

export const ldapSearchSchema = z.object({
	base_dn: z.string().optional(),
	filter: z.string().optional(),
});

export const radiusAuthSchema = z.object({
	username: z.string().optional(),
	password: z.string().optional(),
	nasIdentifier: z.string().optional(),
	nasIpAddress: z.string().optional(),
	secret: z.string().optional(),
});
