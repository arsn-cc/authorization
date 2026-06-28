import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/utils";
import type { RadiusAttribute, RadiusPacket, RadiusConfig, RadiusAuthResult, RadiusCode } from "./types";
import { RADIUS_CODE, RADIUS_ATTR } from "./types";

export {
	RADIUS_CODE,
	RADIUS_ATTR,
	type RadiusAttribute,
	type RadiusPacket,
	type RadiusConfig,
	type RadiusAuthResult,
} from "./types";

function md5(data: Buffer): Buffer {
	return createHash("md5").update(data).digest();
}

export function encodeAttribute(type: number, value: Buffer | string | number): Buffer {
	let val: Buffer;
	if (typeof value === "string") {
		val = Buffer.from(value, "utf8");
	} else if (typeof value === "number") {
		val = Buffer.alloc(4);
		val.writeUInt32BE(value, 0);
	} else {
		val = value;
	}
	const length = 2 + val.length;
	const buf = Buffer.alloc(length);
	buf[0] = type;
	buf[1] = length;
	val.copy(buf, 2);
	return buf;
}

export function decodeAttribute(attr: RadiusAttribute): string | number | Buffer {
	switch (attr.type) {
		case RADIUS_ATTR.NAS_IP_ADDRESS:
		case RADIUS_ATTR.FRAMED_IP_ADDRESS:
		case RADIUS_ATTR.FRAMED_IP_NETMASK:
			return `${attr.value[0]}.${attr.value[1]}.${attr.value[2]}.${attr.value[3]}`;
		case RADIUS_ATTR.NAS_PORT:
		case RADIUS_ATTR.SERVICE_TYPE:
		case RADIUS_ATTR.FRAMED_PROTOCOL:
		case RADIUS_ATTR.FRAMED_MTU:
		case RADIUS_ATTR.SESSION_TIMEOUT:
		case RADIUS_ATTR.IDLE_TIMEOUT:
		case RADIUS_ATTR.ACCT_STATUS_TYPE:
		case RADIUS_ATTR.ACCT_DELAY_TIME:
		case RADIUS_ATTR.ACCT_INPUT_OCTETS:
		case RADIUS_ATTR.ACCT_OUTPUT_OCTETS:
		case RADIUS_ATTR.ACCT_SESSION_TIME:
		case RADIUS_ATTR.ACCT_INPUT_PACKETS:
		case RADIUS_ATTR.ACCT_OUTPUT_PACKETS:
		case RADIUS_ATTR.ACCT_TERMINATE_CAUSE:
		case RADIUS_ATTR.NAS_PORT_TYPE:
			return attr.value.readUInt32BE(0);
		default:
			return attr.value;
	}
}

function findAttribute(attrs: RadiusAttribute[], type: number): RadiusAttribute | undefined {
	return attrs.find((a) => a.type === type);
}

function getStringAttr(attrs: RadiusAttribute[], type: number): string | undefined {
	const attr = findAttribute(attrs, type);
	return attr ? attr.value.toString("utf8") : undefined;
}

export function decodeUserPassword(encrypted: Buffer, requestAuthenticator: Buffer, secret: string): string {
	const secretBuf = Buffer.from(secret, "utf8");
	const passwordLen = encrypted.length;
	const result = Buffer.alloc(passwordLen);
	const blockSize = 16;

	for (let i = 0; i < passwordLen; i += blockSize) {
		const prev = i === 0 ? requestAuthenticator : encrypted.subarray(i - blockSize, i);
		const hash = md5(Buffer.concat([secretBuf, prev]));
		for (let j = 0; j < blockSize && i + j < passwordLen; j++) {
			result[i + j] = encrypted[i + j]! ^ hash[j]!;
		}
	}

	const nullIndex = result.indexOf(0);
	return nullIndex >= 0 ? result.toString("utf8", 0, nullIndex) : result.toString("utf8");
}

export function encodeUserPassword(password: string, requestAuthenticator: Buffer, secret: string): Buffer {
	const secretBuf = Buffer.from(secret, "utf8");
	const paddedLen = Math.ceil(password.length / 16) * 16;
	const padded = Buffer.alloc(paddedLen, 0);
	Buffer.from(password, "utf8").copy(padded);

	const result = Buffer.alloc(paddedLen);
	for (let i = 0; i < paddedLen; i += 16) {
		const prev = i === 0 ? requestAuthenticator : result.subarray(i - 16, i);
		const hash = md5(Buffer.concat([secretBuf, prev]));
		for (let j = 0; j < 16; j++) {
			result[i + j] = padded[i + j]! ^ hash[j]!;
		}
	}
	return result;
}

export function createResponseAuthenticator(
	packet: RadiusPacket,
	code: RadiusCode,
	attributes: RadiusAttribute[],
	secret: string,
): Buffer {
	const codeBuf = Buffer.alloc(1);
	codeBuf[0] = code;
	const idBuf = Buffer.alloc(1);
	idBuf[0] = packet.identifier;
	const attrBuf = encodeAttributes(attributes);
	const len = 4 + 16 + attrBuf.length;
	const lenBuf = Buffer.alloc(2);
	lenBuf.writeUInt16BE(len, 0);
	const secretBuf = Buffer.from(secret, "utf8");
	return md5(Buffer.concat([codeBuf, idBuf, lenBuf, Buffer.alloc(16, 0), attrBuf, secretBuf]));
}

function encodeAttributes(attrs: RadiusAttribute[]): Buffer {
	return Buffer.concat(attrs.map((a) => encodeAttributeRaw(a)));
}

function encodeAttributeRaw(attr: RadiusAttribute): Buffer {
	const buf = Buffer.alloc(2 + attr.value.length);
	buf[0] = attr.type;
	buf[1] = 2 + attr.value.length;
	attr.value.copy(buf, 2);
	return buf;
}

export function createMessageAuthenticator(packet: RadiusPacket, secret: string): Buffer {
	const secretBuf = Buffer.from(secret, "utf8");
	const tempPacket = encodePacketRaw(packet.code, packet.identifier, packet.authenticator, packet.attributes, secret);
	const code = tempPacket[0]!;
	const id = tempPacket[1]!;
	const origAuth = tempPacket.subarray(4, 20);
	const attrsWithDummy = packet.attributes.map((attr) => {
		if (attr.type === RADIUS_ATTR.MESSAGE_AUTHENTICATOR) {
			return { type: attr.type, value: Buffer.alloc(16) };
		}
		return attr;
	});
	const attrBuf = Buffer.concat(attrsWithDummy.map((a) => encodeAttributeRaw(a)));
	const body = Buffer.concat([Buffer.from([code]), Buffer.from([id]), Buffer.alloc(2), origAuth, attrBuf, secretBuf]);
	const msgAuthIndex = attrsWithDummy.findIndex((a) => a.type === RADIUS_ATTR.MESSAGE_AUTHENTICATOR);
	if (msgAuthIndex < 0) {
		return Buffer.alloc(16);
	}
	return md5(body);
}

export function verifyMessageAuthenticator(packet: RadiusPacket, secret: string): boolean {
	const msgAuth = findAttribute(packet.attributes, RADIUS_ATTR.MESSAGE_AUTHENTICATOR);
	if (!msgAuth || msgAuth.value.length !== 16) {
		return false;
	}
	const expected = createMessageAuthenticator(packet, secret);
	return expected.equals(msgAuth.value);
}

export function encodePacket(
	code: RadiusCode,
	identifier: number,
	attributes: RadiusAttribute[],
	secret: string,
	requestAuthenticator?: Buffer,
): Buffer {
	return encodePacketRaw(code, identifier, requestAuthenticator ?? Buffer.alloc(16), attributes, secret);
}

function encodePacketRaw(
	code: number,
	identifier: number,
	authenticator: Buffer,
	attributes: RadiusAttribute[],
	secret: string,
): Buffer {
	const attrBuf = Buffer.concat(attributes.map((a) => encodeAttributeRaw(a)));
	const len = 4 + 16 + attrBuf.length;
	const buf = Buffer.alloc(len);
	buf[0] = code;
	buf[1] = identifier;
	buf.writeUInt16BE(len, 2);
	authenticator.copy(buf, 4);
	attrBuf.copy(buf, 20);

	if (
		code === RADIUS_CODE.ACCESS_ACCEPT ||
		code === RADIUS_CODE.ACCESS_REJECT ||
		code === RADIUS_CODE.ACCESS_CHALLENGE
	) {
		const responseAuth = createResponseAuthenticator(
			{ code: 0 as RadiusCode, identifier, authenticator, attributes },
			code as RadiusCode,
			attributes,
			secret,
		);
		responseAuth.copy(buf, 4);
	}

	return buf;
}

export function decodePacket(buf: Buffer, _secret: string): RadiusPacket {
	const code = buf[0]!;
	const identifier = buf[1]!;
	const len = buf.readUInt16BE(2);
	const authenticator = buf.subarray(4, 20);
	const attrs: RadiusAttribute[] = [];
	let offset = 20;
	while (offset < len) {
		const type = buf[offset]!;
		const attrLen = buf[offset + 1]!;
		if (attrLen < 2) {
			break;
		}
		attrs.push({ type, value: buf.subarray(offset + 2, offset + attrLen) });
		offset += attrLen;
	}
	return { code: code as RadiusCode, identifier, authenticator, attributes: attrs };
}

export async function authenticateUser(packet: RadiusPacket, config: RadiusConfig): Promise<RadiusAuthResult> {
	const username = getStringAttr(packet.attributes, RADIUS_ATTR.USER_NAME);
	if (!username) {
		return { success: false, replyMessage: "Missing User-Name" };
	}

	const passwordAttr = findAttribute(packet.attributes, RADIUS_ATTR.USER_PASSWORD);
	if (!passwordAttr) {
		return { success: false, replyMessage: "Missing User-Password" };
	}

	const password = decodeUserPassword(passwordAttr.value, packet.authenticator, config.secret);

	const db = await getDb();
	const [user] = await db.select().from(schema.user).where(eq(schema.user.email, username));
	if (!user || !user.passwordHash) {
		return { success: false, replyMessage: "Authentication failed" };
	}

	if (!verifyPassword(password, user.passwordHash)) {
		return { success: false, replyMessage: "Authentication failed" };
	}

	return { success: true, replyMessage: "Welcome" };
}

export async function processAccountingRequest(packet: RadiusPacket, _config: RadiusConfig): Promise<RadiusPacket> {
	const username = getStringAttr(packet.attributes, RADIUS_ATTR.USER_NAME);
	const statusAttr = findAttribute(packet.attributes, RADIUS_ATTR.ACCT_STATUS_TYPE);
	const sessionId = getStringAttr(packet.attributes, RADIUS_ATTR.ACCT_SESSION_ID);
	const sessionTime = findAttribute(packet.attributes, RADIUS_ATTR.ACCT_SESSION_TIME);
	const inputOctets = findAttribute(packet.attributes, RADIUS_ATTR.ACCT_INPUT_OCTETS);
	const outputOctets = findAttribute(packet.attributes, RADIUS_ATTR.ACCT_OUTPUT_OCTETS);

	const statusType = statusAttr ? statusAttr.value.readUInt32BE(0) : undefined;

	console.log(
		`[radius:acct] user=${username} status=${statusType} session=${sessionId} time=${sessionTime ? sessionTime.value.readUInt32BE(0) : "?"} in=${inputOctets ? inputOctets.value.readUInt32BE(0) : 0} out=${outputOctets ? outputOctets.value.readUInt32BE(0) : 0}`,
	);

	return {
		code: RADIUS_CODE.ACCOUNTING_RESPONSE,
		identifier: packet.identifier,
		authenticator: packet.authenticator,
		attributes: [],
	};
}
