import { z } from "zod";

export const tokenRequestSchema = z.object({
	grant_type: z.string().min(1),
	client_id: z.string().optional().default(""),
	client_secret: z.string().optional(),
	code: z.string().optional(),
	redirect_uri: z.string().optional(),
	code_verifier: z.string().optional(),
	refresh_token: z.string().optional(),
	scope: z.string().optional(),
});

export const authorizeQuerySchema = z.object({
	response_type: z.string().optional(),
	client_id: z.string().optional(),
	redirect_uri: z.string().optional(),
	scope: z.string().optional(),
	state: z.string().optional(),
	code_challenge: z.string().optional(),
	code_challenge_method: z.string().optional(),
	nonce: z.string().optional(),
	prompt: z.string().optional(),
	max_age: z.string().optional(),
	request_uri: z.string().optional(),
});

export const parFormSchema = z.object({
	client_id: z.string().min(1),
	client_secret: z.string().optional(),
	redirect_uri: z.string().min(1),
	scope: z.string().optional(),
	state: z.string().optional(),
	code_challenge: z.string().optional(),
	code_challenge_method: z.string().optional(),
	nonce: z.string().optional(),
});

export const clientRegisterSchema = z.object({
	client_id: z.string().optional(),
	client_name: z.string().min(1),
	redirect_uris: z.array(z.string()).min(1),
	grant_types: z.array(z.string()).optional(),
	token_endpoint_auth_method: z.string().optional(),
});

export const revokeFormSchema = z.object({
	token: z.string().min(1),
	client_id: z.string().min(1),
	client_secret: z.string().optional(),
});

export const introspectFormSchema = z.object({
	token: z.string().min(1),
	client_id: z.string().optional(),
	client_secret: z.string().optional(),
});

export const deviceFormSchema = z.object({
	client_id: z.string().min(1),
	scope: z.string().optional().default(""),
});
