export interface CasTicket {
	id: number;
	ticket: string;
	service: string;
	userId: number;
	username: string;
	type: "service" | "proxy";
	createdAt: Date;
	expiresAt: Date;
	usedAt: Date | null;
}

export interface CasServerConfig {
	baseUrl: string;
	proxyCallbackUrl?: string;
}

export interface CasLoginParams {
	service: string;
	method?: "GET" | "POST";
	renew?: boolean;
}

export interface CasValidateParams {
	service: string;
	ticket: string;
}

export interface CasTicketResult {
	userId: number;
	username: string;
}

export class CasError extends Error {
	code: string;
	constructor(code: string, message: string) {
		super(message);
		this.name = "CasError";
		this.code = code;
	}
}

export const CasErrorCodes = {
	INVALID_TICKET: "INVALID_TICKET",
	INVALID_SERVICE: "INVALID_SERVICE",
	TICKET_EXPIRED: "TICKET_EXPIRED",
} as const;
