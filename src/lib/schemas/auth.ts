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
	displayName: z.string().nullable().optional(),
	image: z.string().nullable().optional(),
	timezone: z.string().nullable().optional(),
});

export const setSessionSchema = z.object({
	token: z.string().min(1),
	expires: z.string().min(1).optional(),
});
