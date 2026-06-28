import { eq, and, isNull } from "drizzle-orm";
import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import type { CasLoginParams, CasTicketResult } from "./types";

export type { CasTicket, CasServerConfig, CasLoginParams, CasValidateParams, CasTicketResult } from "./types";
export { CasError, CasErrorCodes } from "./types";

const casTicket = pgTable("cas_ticket", {
	id: serial("id").primaryKey(),
	ticket: text("ticket").notNull().unique(),
	service: text("service").notNull(),
	userId: integer("user_id").notNull(),
	username: text("username").notNull(),
	type: text("type").notNull().default("service"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	expiresAt: timestamp("expires_at").notNull(),
	usedAt: timestamp("used_at"),
});

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function generateTicketValue(): string {
	return `ST-${randomBytes(32).toString("hex")}`;
}

export function getTicketTtl(): number {
	const env = process.env.CAS_SERVICE_TICKET_TTL;
	if (env) {
		const parsed = Number.parseInt(env, 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			return parsed;
		}
	}
	return 300;
}

export function createLoginUrl(params: CasLoginParams): string {
	const baseUrl = process.env.CAS_BASE_URL ?? "http://localhost:3000/cas";
	const url = new URL(`${baseUrl}/login`);
	url.searchParams.set("service", params.service);
	if (params.renew) {
		url.searchParams.set("renew", "true");
	}
	return url.toString();
}

export function createLogoutUrl(service?: string): string {
	const baseUrl = process.env.CAS_BASE_URL ?? "http://localhost:3000/cas";
	const url = new URL(`${baseUrl}/logout`);
	if (service) {
		url.searchParams.set("service", service);
	}
	return url.toString();
}

export async function generateServiceTicket(service: string, userId: number, username: string): Promise<string> {
	const db = await getDb();
	const ticket = generateTicketValue();
	const ttl = getTicketTtl();
	const expiresAt = new Date(Date.now() + ttl * 1000);

	await db.insert(casTicket).values({
		ticket,
		service,
		userId,
		username,
		type: "service",
		expiresAt,
	});

	return ticket;
}

export async function validateServiceTicket(ticket: string, service: string): Promise<CasTicketResult | null> {
	const db = await getDb();
	const [row] = await db
		.select()
		.from(casTicket)
		.where(and(eq(casTicket.ticket, ticket), eq(casTicket.service, service), isNull(casTicket.usedAt)));

	if (!row) {
		return null;
	}

	if (row.expiresAt <= new Date()) {
		return null;
	}

	await db.update(casTicket).set({ usedAt: new Date() }).where(eq(casTicket.id, row.id));

	return { userId: row.userId, username: row.username };
}

export function createServiceResponse(user: CasTicketResult): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
	<cas:authenticationSuccess>
		<cas:user>${escapeXml(user.username)}</cas:user>
	</cas:authenticationSuccess>
</cas:serviceResponse>`;
}

export function createServiceFailureResponse(code: string, message: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
	<cas:authenticationFailure code="${escapeXml(code)}">
		${escapeXml(message)}
	</cas:authenticationFailure>
</cas:serviceResponse>`;
}
