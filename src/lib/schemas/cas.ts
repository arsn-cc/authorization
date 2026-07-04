import { z } from "zod";

export const casTicketSchema = z.object({
	ticket: z.string().min(1),
	service: z.string().min(1),
});

export const casSamlValidateSchema = z.object({
	ticket: z.string().min(1),
	service: z.string().min(1),
	SAMLart: z.string().optional(),
});
