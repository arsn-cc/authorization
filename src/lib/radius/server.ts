import dgram from "node:dgram";
import type { RadiusConfig, RadiusPacket, RadiusCode } from "./types";
import { RADIUS_CODE } from "./types";
import { decodePacket, encodePacket, authenticateUser, processAccountingRequest } from "./index";

const RADIUS_AUTH_PORT = 1812;
const RADIUS_ACCT_PORT = 1813;

export interface RadiusServerHandle {
	authSocket: dgram.Socket;
	acctSocket: dgram.Socket;
	close: () => Promise<void>;
}

export function startRadiusServer(config: RadiusConfig): RadiusServerHandle {
	const authPort = config.authPort || RADIUS_AUTH_PORT;
	const acctPort = config.acctPort || RADIUS_ACCT_PORT;

	const authSocket = dgram.createSocket("udp4");
	const acctSocket = dgram.createSocket("udp4");

	authSocket.on("message", async (msg, rinfo) => {
		try {
			const packet = decodePacket(msg, config.secret);

			if (!verifyRequestAuthenticator(packet, config.secret, msg)) {
				console.error("[radius:auth] invalid authenticator");
				return;
			}

			const result = await authenticateUser(packet, config);

			const responseCode: RadiusCode = result.success ? RADIUS_CODE.ACCESS_ACCEPT : RADIUS_CODE.ACCESS_REJECT;

			const attrs: Array<{ type: number; value: Buffer }> = [];
			if (result.replyMessage) {
				attrs.push({ type: 18, value: Buffer.from(result.replyMessage, "utf8") });
			}
			if (result.sessionTimeout) {
				const buf = Buffer.alloc(4);
				buf.writeUInt32BE(result.sessionTimeout, 0);
				attrs.push({ type: 27, value: buf });
			}

			const responseBuf = encodePacket(responseCode, packet.identifier, attrs, config.secret, packet.authenticator);
			authSocket.send(responseBuf, rinfo.port, rinfo.address);
		} catch (err) {
			console.error("[radius:auth] error:", err);
		}
	});

	authSocket.on("error", (err) => {
		console.error("[radius:auth] socket error:", err);
	});

	acctSocket.on("message", async (msg, rinfo) => {
		try {
			const packet = decodePacket(msg, config.secret);

			if (!verifyRequestAuthenticator(packet, config.secret, msg)) {
				console.error("[radius:acct] invalid authenticator");
				return;
			}

			const response = await processAccountingRequest(packet, config);
			const responseBuf = encodePacket(
				response.code,
				response.identifier,
				response.attributes,
				config.secret,
				packet.authenticator,
			);
			acctSocket.send(responseBuf, rinfo.port, rinfo.address);
		} catch (err) {
			console.error("[radius:acct] error:", err);
		}
	});

	acctSocket.on("error", (err) => {
		console.error("[radius:acct] socket error:", err);
	});

	authSocket.bind(authPort);
	acctSocket.bind(acctPort);

	console.log(`[radius] auth listening on port ${authPort}, accounting on ${acctPort}`);

	return {
		authSocket,
		acctSocket,
		close: async () => {
			await Promise.all([
				new Promise<void>((resolve) => authSocket.close(() => resolve())),
				new Promise<void>((resolve) => acctSocket.close(() => resolve())),
			]);
		},
	};
}

function verifyRequestAuthenticator(packet: RadiusPacket, _secret: string, _msg: Buffer): boolean {
	return packet.authenticator.length === 16 && !packet.authenticator.every((b) => b === 0);
}
