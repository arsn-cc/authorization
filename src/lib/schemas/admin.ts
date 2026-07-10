import { z } from "zod";

export const createPermissionSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable().optional(),
});

export const updatePermissionSchema = z.object({
	name: z.string().optional(),
	description: z.string().nullable().optional(),
});

export const createRoleSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	permissions: z.string().optional().default("[]"),
});

export const updateRoleSchema = z.object({
	name: z.string().optional(),
	description: z.string().nullable().optional(),
	permissions: z.string().optional(),
});

export const createUserSchema = z.object({
	username: z.string().min(3).max(64),
	password: z.string().min(8).optional(),
	name: z.string().optional(),
	roleId: z.number().nullable().optional(),
});

export const updateUserSchema = z.object({
	name: z.string().nullable().optional(),
	displayName: z.string().nullable().optional(),
	image: z.string().nullable().optional(),
	timezone: z.string().nullable().optional(),
	roleId: z.number().nullable().optional(),
	username: z.string().optional(),
	password: z.string().optional(),
	lockedUntil: z.string().nullable().optional(),
	suspensionReason: z.string().nullable().optional(),
});

export const createClientSchema = z.object({
	clientId: z.string().min(1),
	type: z.string().min(1),
	name: z.string().min(1),
	clientSecret: z.string().optional(),
	redirectUris: z.string().nullable().optional(),
	grants: z.string().nullable().optional(),
	scopes: z.string().optional().default("openid profile email"),
	requireConsent: z.boolean().optional(),
	pkceRequired: z.boolean().nullable().optional(),
	accessTokenTtl: z.number().nullable().optional(),
	refreshTokenRotationEnabled: z.boolean().nullable().optional(),
	reuseRefreshTokens: z.boolean().nullable().optional(),
	tokenEndpointAuthMethod: z.string().nullable().optional(),
	dpopBound: z.boolean().nullable().optional(),
	entityId: z.string().nullable().optional(),
	acsUrl: z.string().nullable().optional(),
	samlCertificate: z.string().nullable().optional(),
	samlBinding: z.string().nullable().optional(),
});

export const updateClientSchema = z.object({
	name: z.string().optional(),
	redirectUris: z.string().nullable().optional(),
	grants: z.string().nullable().optional(),
	scopes: z.string().optional(),
	clientSecret: z.string().nullable().optional(),
	requireConsent: z.boolean().nullable().optional(),
	pkceRequired: z.boolean().nullable().optional(),
	accessTokenTtl: z.number().nullable().optional(),
	refreshTokenRotationEnabled: z.boolean().nullable().optional(),
	reuseRefreshTokens: z.boolean().nullable().optional(),
	tokenEndpointAuthMethod: z.string().nullable().optional(),
	dpopBound: z.boolean().nullable().optional(),
	entityId: z.string().nullable().optional(),
	acsUrl: z.string().nullable().optional(),
	samlCertificate: z.string().nullable().optional(),
	samlBinding: z.string().nullable().optional(),
});

export const createPatSchema = z.object({
	name: z.string().min(1),
	scopes: z.string().optional().default("admin:read"),
});

export const updateSettingsSchema = z
	.object({
		primary_color: z
			.string()
			.regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "primary_color must be a hex color")
			.nullable()
			.optional(),
		// Stored as the literal strings "true"/"false".
		disable_registration: z.enum(["true", "false"]).nullable().optional(),
	})
	.partial();
