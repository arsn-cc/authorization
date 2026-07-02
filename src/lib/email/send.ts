import nodemailer from "nodemailer";

export interface SendEmailInput {
	to: string;
	subject: string;
	html: string;
}

export type SendEmailResult =
	| { success: true; messageId: string }
	| { success: false; error: { code: string; message: string } };

let _transport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
	if (!_transport) {
		_transport = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT) || 587,
			secure: process.env.SMTP_SECURE === "true",
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});
	}
	return _transport;
}

const rawName = process.env.SMTP_FROM_NAME ?? "ARSN";
const rawAddress = process.env.SMTP_FROM_ADDRESS ?? "noreply@arsn.cc";
const fromName = rawName.replace(/[\r\n]/g, "").trim();
const fromAddress = rawAddress.replace(/[\r\n]/g, "").trim();

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
	try {
		const info = await getTransport().sendMail({
			from: { name: fromName, address: fromAddress },
			to: input.to,
			subject: input.subject,
			html: input.html,
		});
		return { success: true, messageId: info.messageId };
	} catch (cause) {
		const genericMsg = cause instanceof Error ? cause.message : "Unknown SMTP error";
		return { success: false, error: { code: "SMTP_ERROR", message: genericMsg } };
	}
}
