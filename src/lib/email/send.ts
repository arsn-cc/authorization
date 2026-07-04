import { UseSend } from "usesend-js";

export interface SendEmailInput {
	to: string;
	subject: string;
	html: string;
}

export type SendEmailResult =
	| { success: true; id: string }
	| { success: false; error: { code: string; message: string } };

const apiKey = process.env.USESEND_API_KEY ?? "";
const baseUrl = process.env.USESEND_BASE_URL;
const fromAddress = (process.env.USESEND_FROM_ADDRESS ?? "noreply@arsn.cc").replace(/[\r\n]/g, "").trim();
const fromName = (process.env.USESEND_FROM_NAME ?? "ARSN").replace(/[\r\n]/g, "").trim();

let _client: UseSend | null = null;

function getClient(): UseSend {
	if (!_client) {
		_client = baseUrl ? new UseSend(apiKey, baseUrl) : new UseSend(apiKey);
	}
	return _client;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
	if (!apiKey) {
		return { success: false, error: { code: "MISSING_API_KEY", message: "USESEND_API_KEY is not set" } };
	}

	try {
		const response = await getClient().emails.send({
			to: input.to,
			from: fromName ? `${fromName} <${fromAddress}>` : fromAddress,
			subject: input.subject,
			html: input.html,
		});
		const emailId = (response as { emailId?: string }).emailId ?? "";
		return { success: true, id: emailId };
	} catch (cause) {
		const genericMsg = cause instanceof Error ? cause.message : "Unknown useSend error";
		return { success: false, error: { code: "USESEND_ERROR", message: genericMsg } };
	}
}
