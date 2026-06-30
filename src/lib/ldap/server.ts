import net from "node:net";
import { timingSafeEqual } from "node:crypto";
import type { LdapServerConfig, LdapSearchFilter } from "./types";
import { LDAP_RESULT } from "./types";
import {
	decodeLdapMessage,
	decodeInteger,
	decodeOctetString,
	decodeSequence,
	decodeTag,
	encodeBindResponse,
	encodeSearchResultEntry,
	encodeSearchResultDone,
} from "./ber";
import { getDefaultServerConfig, searchUsers, searchGroups, matchFilter, verifyLdapUserBind } from "./index";

function safeCompare(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	if (bufA.length !== bufB.length) {
		return false;
	}
	return timingSafeEqual(bufA, bufB);
}

interface LdapConnectionState {
	id: number;
	socket: net.Socket;
	buffer: Buffer;
	authenticated: boolean;
	bindDn: string;
}

export function startLdapServer(config?: Partial<LdapServerConfig>): net.Server {
	const cfg = { ...getDefaultServerConfig(), ...config };

	let connectionId = 0;

	const server = net.createServer((socket) => {
		const state: LdapConnectionState = {
			id: ++connectionId,
			socket,
			buffer: Buffer.alloc(0),
			authenticated: false,
			bindDn: "",
		};

		socket.on("data", (data: Buffer) => {
			state.buffer = Buffer.concat([state.buffer, data]);
			processBuffer(state, cfg);
		});

		socket.on("error", (err) => {
			console.error(`[ldap:conn=${state.id}] socket error:`, err.message);
		});

		socket.on("close", () => {
			console.log(`[ldap:conn=${state.id}] closed`);
		});

		console.log(`[ldap:conn=${state.id}] connected`);
	});

	server.listen(cfg.port, () => {
		console.log(`[ldap] listening on port ${cfg.port}`);
	});

	server.on("error", (err) => {
		console.error("[ldap] server error:", err);
	});

	return server;
}

function processBuffer(state: LdapConnectionState, cfg: LdapServerConfig): void {
	while (state.buffer.length > 2) {
		const totalLen = getBerLength(state.buffer);
		if (totalLen < 0 || state.buffer.length < totalLen) {
			return;
		}

		const msg = state.buffer.subarray(0, totalLen);
		state.buffer = state.buffer.subarray(totalLen);

		try {
			handleMessage(state, msg, cfg);
		} catch (err) {
			console.error(`[ldap:conn=${state.id}] error handling message:`, err);
		}
	}
}

function getBerLength(buf: Buffer): number {
	if (buf.length < 2) {
		return -1;
	}
	const lenByte = buf[1]!;
	if (lenByte < 0x80) {
		return 2 + lenByte;
	}
	const numBytes = lenByte & 0x7f;
	if (2 + numBytes > buf.length) {
		return -1;
	}
	let length = 0;
	for (let i = 0; i < numBytes; i++) {
		length = (length << 8) | buf[2 + i]!;
	}
	return 2 + numBytes + length;
}

function handleMessage(state: LdapConnectionState, msg: Buffer, cfg: LdapServerConfig): void {
	const decoded = decodeLdapMessage(msg);

	switch (decoded.protocolOp) {
		case 0x60: {
			handleBind(state, decoded.id, decoded.payload, cfg);
			break;
		}
		case 0x63: {
			handleSearch(state, decoded.id, decoded.payload, cfg);
			break;
		}
		case 0x42: {
			socketWrite(state.socket, encodeBindResponse(decoded.id, 0, "", ""));
			state.socket.end();
			break;
		}
		default:
			console.log(`[ldap:conn=${state.id}] unhandled op: ${decoded.protocolOp.toString(16)}`);
			socketWrite(state.socket, encodeBindResponse(decoded.id, LDAP_RESULT.PROTOCOL_ERROR, "", "Unknown operation"));
	}
}

function handleBind(state: LdapConnectionState, id: number, payload: Buffer, cfg: LdapServerConfig): void {
	try {
		const { value: _version, endOffset: vEnd } = decodeInteger(payload, 0);
		const { value: name, endOffset: nEnd } = decodeOctetString(payload, vEnd);
		const authTag = decodeTag(payload, nEnd);
		const authMethod = authTag.tag;
		let password = "";
		if (authMethod === 0x80) {
			const authSeq = decodeSequence(payload, nEnd);
			const { value: pw } = decodeOctetString(authSeq.value, 0);
			password = pw.toString("utf8");
		}

		const dn = name.toString("utf8");
		const isAdmin = safeCompare(dn, cfg.adminDn);
		const adminOk = isAdmin && safeCompare(password, cfg.adminPassword);
		if (!isAdmin) {
			verifyLdapUserBind(dn, password)
				.then((ok) => {
					if (ok) {
						state.authenticated = true;
						state.bindDn = dn;
						return socketWrite(state.socket, encodeBindResponse(id, 0, "", ""));
					} else {
						return socketWrite(
							state.socket,
							encodeBindResponse(id, LDAP_RESULT.INVALID_DN_SYNTAX, "", "Invalid credentials"),
						);
					}
				})
				.catch(() => {
					return socketWrite(state.socket, encodeBindResponse(id, LDAP_RESULT.OPERATIONS_ERROR, "", "Internal error"));
				});
			return;
		}

		if (adminOk) {
			state.authenticated = true;
			state.bindDn = dn;
			socketWrite(state.socket, encodeBindResponse(id, 0, "", ""));
		} else {
			socketWrite(state.socket, encodeBindResponse(id, LDAP_RESULT.INVALID_DN_SYNTAX, "", "Invalid credentials"));
		}
	} catch {
		socketWrite(state.socket, encodeBindResponse(id, LDAP_RESULT.PROTOCOL_ERROR, "", "Invalid bind request"));
	}
}

function handleSearch(state: LdapConnectionState, id: number, payload: Buffer, cfg: LdapServerConfig): void {
	if (!state.authenticated) {
		socketWrite(state.socket, encodeSearchResultDone(id, LDAP_RESULT.STRONGER_AUTH_REQUIRED));
		return;
	}

	try {
		const _scope = decodeSearchScope(payload);
		const filter = decodeSearchFilter(payload);

		searchUsers(cfg.domain)
			.then((userEntries) => {
				for (const attrs of userEntries) {
					if (matchFilter(attrs, filter)) {
						const dn = attrs.find((a) => a.type === "dn")?.vals[0] ?? "";
						const nonDnAttrs = attrs.filter((a) => a.type !== "dn");
						socketWrite(state.socket, encodeSearchResultEntry(id, dn, nonDnAttrs));
					}
				}
				return searchGroups(cfg.domain);
			})
			.then((groupEntries) => {
				for (const attrs of groupEntries) {
					if (matchFilter(attrs, filter)) {
						const dn = attrs.find((a) => a.type === "dn")?.vals[0] ?? "";
						const nonDnAttrs = attrs.filter((a) => a.type !== "dn");
						socketWrite(state.socket, encodeSearchResultEntry(id, dn, nonDnAttrs));
					}
				}
				return socketWrite(state.socket, encodeSearchResultDone(id, 0));
			})
			.catch((err) => {
				console.error(`[ldap:conn=${state.id}] search error:`, err);
				return socketWrite(state.socket, encodeSearchResultDone(id, LDAP_RESULT.OPERATIONS_ERROR));
			});
	} catch {
		socketWrite(state.socket, encodeSearchResultDone(id, LDAP_RESULT.PROTOCOL_ERROR));
	}
}

function decodeSearchScope(payload: Buffer): number {
	try {
		const { value: _baseObject, endOffset: boEnd } = decodeOctetString(payload, 0);
		const scopeTag = decodeTag(payload, boEnd);
		if (scopeTag.tag === 0x0a) {
			return scopeTag.value[0] ?? 0;
		}
		const scopeInt = decodeInteger(payload, boEnd);
		return scopeInt.value;
	} catch {
		return 0;
	}
}

function decodeSearchFilter(payload: Buffer, _offset?: number): LdapSearchFilter {
	const scopeTag = decodeTag(payload, 0);
	const _bo = decodeOctetString(payload, 0);
	const filterStart = scopeTag.endOffset;
	const filterTag = decodeTag(payload, filterStart);

	switch (filterTag.tag) {
		case 0xa0:
			return { type: 0, filters: [decodeSearchFilterItem(filterTag.value)] };
		case 0xa1:
			return { type: 1, filters: [decodeSearchFilterItem(filterTag.value)] };
		case 0xa2:
			return { type: 2, filters: [decodeSearchFilterItem(filterTag.value)] };
		case 0xa3: {
			const attr = decodeOctetString(filterTag.value, 0);
			const val = decodeOctetString(filterTag.value, attr.endOffset);
			return { type: 3, attribute: attr.value.toString("utf8"), value: val.value.toString("utf8") };
		}
		case 0xa7: {
			const attr = decodeOctetString(filterTag.value, 0);
			return { type: 7, attribute: attr.value.toString("utf8") };
		}
		default:
			return { type: 3, attribute: "objectClass", value: "*" };
	}
}

function decodeSearchFilterItem(buf: Buffer): LdapSearchFilter {
	const tag = decodeTag(buf, 0);
	switch (tag.tag) {
		case 0xa0:
			return { type: 0, filters: [decodeSearchFilterItem(tag.value)] };
		case 0xa3: {
			const attr = decodeOctetString(tag.value, 0);
			const val = decodeOctetString(tag.value, attr.endOffset);
			return { type: 3, attribute: attr.value.toString("utf8"), value: val.value.toString("utf8") };
		}
		case 0xa7: {
			const attr = decodeOctetString(tag.value, 0);
			return { type: 7, attribute: attr.value.toString("utf8") };
		}
		default:
			return { type: 3, attribute: "objectClass", value: "*" };
	}
}

function socketWrite(socket: net.Socket, data: Buffer): void {
	socket.write(data);
}
