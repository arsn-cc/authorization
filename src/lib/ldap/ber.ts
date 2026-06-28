import type { LdapSearchFilter } from "./types";

const TAG_SEQUENCE = 0x30;
const TAG_INTEGER = 0x02;
const TAG_OCTET_STRING = 0x04;
const TAG_NULL = 0x05;
const TAG_BOOLEAN = 0x01;
const TAG_CONTEXT_0 = 0x80;
const TAG_CONTEXT_1 = 0xa1;
const TAG_CONTEXT_2 = 0xa2;
const TAG_CONTEXT_3 = 0xa3;
const TAG_CONTEXT_4 = 0xa4;
const TAG_CONTEXT_5 = 0xa5;
const TAG_CONTEXT_6 = 0xa6;
const TAG_CONTEXT_7 = 0xa7;
const TAG_CONTEXT_8 = 0xa8;

export function encodeLength(length: number): Buffer {
	if (length < 128) {
		return Buffer.from([length]);
	}
	const bytes: number[] = [];
	let val = length;
	while (val > 0) {
		bytes.unshift(val & 0xff);
		val >>= 8;
	}
	return Buffer.from([0x80 | bytes.length, ...bytes]);
}

export function decodeLength(buf: Buffer, offset: number): { length: number; endOffset: number } {
	const first = buf[offset]!;
	if (first < 0x80) {
		return { length: first, endOffset: offset + 1 };
	}
	const numBytes = first & 0x7f;
	let length = 0;
	for (let i = 0; i < numBytes; i++) {
		length = (length << 8) | buf[offset + 1 + i]!;
	}
	return { length, endOffset: offset + 1 + numBytes };
}

export function encodeTag(tag: number, value: Buffer): Buffer {
	return Buffer.concat([Buffer.from([tag]), encodeLength(value.length), value]);
}

export function encodeInteger(value: number): Buffer {
	if (value >= -128 && value < 128) {
		return Buffer.from([0x02, 0x01, value & 0xff]);
	}
	const bytes: number[] = [];
	let val = value;
	const isNeg = value < 0;
	while (val !== 0 && val !== -1) {
		bytes.unshift(val & 0xff);
		val >>= 8;
	}
	if (isNeg && bytes.length > 0 && (bytes[0]! & 0x80) === 0) {
		bytes.unshift(0xff);
	}
	if (!isNeg && bytes.length > 0 && (bytes[0]! & 0x80) !== 0) {
		bytes.unshift(0x00);
	}
	return encodeTag(TAG_INTEGER, Buffer.from(bytes));
}

export function encodeBoolean(value: boolean): Buffer {
	return Buffer.from([TAG_BOOLEAN, 0x01, value ? 0xff : 0x00]);
}

export function encodeOctetString(value: string | Buffer): Buffer {
	const buf = typeof value === "string" ? Buffer.from(value, "utf8") : value;
	return encodeTag(TAG_OCTET_STRING, buf);
}

export function encodeNull(): Buffer {
	return Buffer.from([TAG_NULL, 0x00]);
}

export function encodeSequence(contents: Buffer): Buffer {
	return encodeTag(TAG_SEQUENCE, contents);
}

export function decodeTag(
	buf: Buffer,
	offset: number,
): { tag: number; length: number; value: Buffer; endOffset: number } {
	const tag = buf[offset]!;
	const { length, endOffset: lenEnd } = decodeLength(buf, offset + 1);
	const valueStart = lenEnd;
	const value = buf.subarray(valueStart, valueStart + length);
	return { tag, length, value, endOffset: valueStart + length };
}

export function decodeInteger(buf: Buffer, offset: number): { value: number; endOffset: number } {
	const { tag, length, value, endOffset } = decodeTag(buf, offset);
	if (tag !== TAG_INTEGER) {
		return { value: 0, endOffset };
	}
	if (length === 1) {
		return { value: value[0]! & 0xff, endOffset };
	}
	let val = 0;
	for (let i = 0; i < length; i++) {
		val = (val << 8) | value[i]!;
	}
	return { value: val, endOffset };
}

export function decodeOctetString(buf: Buffer, offset: number): { value: Buffer; endOffset: number } {
	const { tag, length: _length, value, endOffset } = decodeTag(buf, offset);
	if (tag !== TAG_OCTET_STRING) {
		return { value: Buffer.alloc(0), endOffset };
	}
	return { value, endOffset };
}

export function decodeBoolean(buf: Buffer, offset: number): { value: boolean; endOffset: number } {
	const { tag, value: val, endOffset } = decodeTag(buf, offset);
	if (tag !== TAG_BOOLEAN) {
		return { value: false, endOffset };
	}
	return { value: val[0] !== 0x00, endOffset };
}

export function decodeSequence(buf: Buffer, offset: number): { value: Buffer; endOffset: number } {
	const { tag, value, endOffset } = decodeTag(buf, offset);
	if (tag !== TAG_SEQUENCE) {
		return { value: Buffer.alloc(0), endOffset };
	}
	return { value, endOffset };
}

export function encodeLdapMessage(id: number, protocolOp: number, payload: Buffer): Buffer {
	const msgId = encodeInteger(id);
	const opTag = protocolOp >= 0x80 ? protocolOp : 0xa0 + protocolOp;
	const opPayload = encodeTag(opTag, payload);
	return encodeSequence(Buffer.concat([msgId, opPayload]));
}

export function decodeLdapMessage(buf: Buffer): { id: number; protocolOp: number; payload: Buffer } {
	const seq = decodeSequence(buf, 0);
	const { value: id, endOffset: idEnd } = decodeInteger(seq.value, 0);
	const opTag = decodeTag(seq.value, idEnd);
	return { id, protocolOp: opTag.tag, payload: opTag.value };
}

export function encodeFilter(filter: LdapSearchFilter): Buffer {
	switch (filter.type) {
		case 0: {
			const contents = Buffer.concat((filter.filters ?? []).map((f) => encodeFilter(f)));
			return encodeTag(TAG_CONTEXT_0, contents);
		}
		case 1: {
			const contents = Buffer.concat((filter.filters ?? []).map((f) => encodeFilter(f)));
			return encodeTag(TAG_CONTEXT_1, contents);
		}
		case 2: {
			return encodeTag(TAG_CONTEXT_2, encodeFilter(filter.filters![0]!));
		}
		case 3: {
			const attr = encodeOctetString(filter.attribute ?? "");
			const val = encodeOctetString(filter.value ?? "");
			return encodeTag(TAG_CONTEXT_3, Buffer.concat([attr, val]));
		}
		case 4: {
			const attr = encodeOctetString(filter.attribute ?? "");
			const subs = (filter.substrings ?? []).map((s) => {
				const tag = s.type === "initial" ? TAG_CONTEXT_0 : s.type === "any" ? TAG_CONTEXT_1 : TAG_CONTEXT_2;
				return Buffer.from([tag, s.value.length, ...Buffer.from(s.value, "utf8")]);
			});
			return encodeTag(TAG_CONTEXT_4, Buffer.concat([attr, ...subs]));
		}
		case 5: {
			const attr = encodeOctetString(filter.attribute ?? "");
			const val = encodeOctetString(filter.value ?? "");
			return encodeTag(TAG_CONTEXT_5, Buffer.concat([attr, val]));
		}
		case 6: {
			const attr = encodeOctetString(filter.attribute ?? "");
			const val = encodeOctetString(filter.value ?? "");
			return encodeTag(TAG_CONTEXT_6, Buffer.concat([attr, val]));
		}
		case 7: {
			return encodeTag(TAG_CONTEXT_7, encodeOctetString(filter.attribute ?? ""));
		}
		case 8: {
			const attr = encodeOctetString(filter.attribute ?? "");
			const val = encodeOctetString(filter.value ?? "");
			return encodeTag(TAG_CONTEXT_8, Buffer.concat([attr, val]));
		}
		default:
			return encodeNull();
	}
}

export function encodeSearchResultEntry(
	id: number,
	dn: string,
	attributes: Array<{ type: string; vals: string[] }>,
): Buffer {
	const dnBuf = encodeOctetString(dn);
	const attrSeq = Buffer.concat(
		attributes.map((attr) => {
			const type = encodeOctetString(attr.type);
			const vals = Buffer.concat(attr.vals.map((v) => encodeOctetString(v)));
			const valsSeq = encodeSequence(vals);
			return encodeSequence(Buffer.concat([type, valsSeq]));
		}),
	);
	const attrList = encodeSequence(attrSeq);
	return encodeLdapMessage(id, 4, Buffer.concat([dnBuf, attrList]));
}

export function encodeBindResponse(id: number, resultCode: number, matchedDn: string, errorMessage: string): Buffer {
	return encodeLdapMessage(
		id,
		1,
		Buffer.concat([encodeInteger(resultCode), encodeOctetString(matchedDn), encodeOctetString(errorMessage)]),
	);
}

export function encodeSearchResultDone(id: number, resultCode: number): Buffer {
	return encodeLdapMessage(
		id,
		5,
		Buffer.concat([encodeInteger(resultCode), encodeOctetString(""), encodeOctetString("")]),
	);
}
