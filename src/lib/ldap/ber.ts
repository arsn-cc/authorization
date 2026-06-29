import asn1 from "asn1";
import type { LdapSearchFilter } from "./types";

const { BerReader, BerWriter, Ber } = asn1;

export function encodeLength(length: number): Buffer {
	if (length < 128) {
		return Buffer.from([length]);
	}
	const w = new BerWriter();
	w.writeString(" ".repeat(length));
	const buf = w.buffer;
	const r = new BerReader(buf);
	r.readByte();
	const end = r.readLength(r.offset)!;
	return buf.subarray(1, end);
}

export function decodeLength(buf: Buffer, offset: number): { length: number; endOffset: number } {
	const r = new BerReader(buf.subarray(offset));
	const tag = r.readByte();
	if (tag === null) {
		return { length: 0, endOffset: offset };
	}
	const end = r.readLength(r.offset);
	if (end === null) {
		return { length: 0, endOffset: offset + 1 };
	}
	return { length: r.length, endOffset: offset + end };
}

export function encodeTag(tag: number, value: Buffer): Buffer {
	const w = new BerWriter();
	w.writeBuffer(value, tag);
	return w.buffer;
}

export function encodeInteger(value: number): Buffer {
	const w = new BerWriter();
	w.writeInt(value);
	return w.buffer;
}

export function encodeBoolean(value: boolean): Buffer {
	const w = new BerWriter();
	w.writeBoolean(value);
	return w.buffer;
}

export function encodeOctetString(value: string | Buffer): Buffer {
	const w = new BerWriter();
	if (typeof value === "string") {
		w.writeString(value);
	} else {
		w.writeBuffer(value, Ber.OctetString);
	}
	return w.buffer;
}

export function encodeNull(): Buffer {
	const w = new BerWriter();
	w.writeNull();
	return w.buffer;
}

export function encodeSequence(contents: Buffer): Buffer {
	const w = new BerWriter();
	w.writeBuffer(contents, Ber.Sequence | Ber.Constructor);
	return w.buffer;
}

export function decodeTag(
	buf: Buffer,
	offset: number,
): { tag: number; length: number; value: Buffer; endOffset: number } {
	const r = new BerReader(buf.subarray(offset));
	const tag = r.peek();
	if (tag === null) {
		return { tag: 0, length: 0, value: Buffer.alloc(0), endOffset: offset };
	}
	r.readByte();
	const lenEnd = r.readLength(r.offset);
	if (lenEnd === null) {
		return { tag, length: 0, value: Buffer.alloc(0), endOffset: offset + 1 };
	}
	const value = buf.subarray(offset + lenEnd, offset + lenEnd + r.length);
	return { tag, length: r.length, value, endOffset: offset + lenEnd + r.length };
}

export function decodeInteger(buf: Buffer, offset: number): { value: number; endOffset: number } {
	try {
		const r = new BerReader(buf.subarray(offset));
		const val = r.readInt();
		return { value: val, endOffset: offset + r.offset };
	} catch {
		return { value: 0, endOffset: offset + 2 };
	}
}

export function decodeOctetString(buf: Buffer, offset: number): { value: Buffer; endOffset: number } {
	try {
		const r = new BerReader(buf.subarray(offset));
		if (r.peek() !== Ber.OctetString) {
			return { value: Buffer.alloc(0), endOffset: offset + 2 };
		}
		const val = r.readString(Ber.OctetString, true) as Buffer;
		return { value: val, endOffset: offset + r.offset };
	} catch {
		return { value: Buffer.alloc(0), endOffset: offset + 2 };
	}
}

export function decodeBoolean(buf: Buffer, offset: number): { value: boolean; endOffset: number } {
	try {
		const r = new BerReader(buf.subarray(offset));
		const val = r.readBoolean();
		return { value: val, endOffset: offset + r.offset };
	} catch {
		return { value: false, endOffset: offset + 2 };
	}
}

export function decodeSequence(buf: Buffer, offset: number): { value: Buffer; endOffset: number } {
	try {
		const r = new BerReader(buf.subarray(offset));
		r.readSequence(Ber.Sequence | Ber.Constructor);
		const value = buf.subarray(offset + r.offset, offset + r.offset + r.length);
		return { value, endOffset: offset + r.offset + r.length };
	} catch {
		return { value: Buffer.alloc(0), endOffset: offset };
	}
}

export function encodeLdapMessage(id: number, protocolOp: number, payload: Buffer): Buffer {
	const msgId = encodeInteger(id);
	const opTag = protocolOp >= 0x80 ? protocolOp : 0xa0 + protocolOp;
	const opPayload = encodeTag(opTag, payload);
	return encodeSequence(Buffer.concat([msgId, opPayload]));
}

export function decodeLdapMessage(buf: Buffer): { id: number; protocolOp: number; payload: Buffer } {
	const r = new BerReader(buf);
	try {
		r.readSequence();
		const id = r.readInt();
		const opTag = r.peek()!;
		const payload = (r.readString(opTag, true) || Buffer.alloc(0)) as Buffer;
		return { id, protocolOp: opTag, payload };
	} catch {
		return { id: 0, protocolOp: 0, payload: Buffer.alloc(0) };
	}
}

export function encodeFilter(filter: LdapSearchFilter): Buffer {
	switch (filter.type) {
		case 0:
			return encodeTag(0xa0, Buffer.concat((filter.filters ?? []).map(encodeFilter)));
		case 1:
			return encodeTag(0xa1, Buffer.concat((filter.filters ?? []).map(encodeFilter)));
		case 2:
			return encodeTag(0xa2, encodeFilter(filter.filters![0]!));
		case 3: {
			const w = new BerWriter();
			w.writeString(filter.attribute ?? "");
			w.writeString(filter.value ?? "");
			return encodeTag(0xa3, w.buffer);
		}
		case 4: {
			const w = new BerWriter();
			w.writeString(filter.attribute ?? "");
			for (const s of filter.substrings ?? []) {
				const tag = s.type === "initial" ? 0x80 : s.type === "any" ? 0x81 : 0x82;
				w.writeBuffer(Buffer.from(s.value, "utf8"), tag);
			}
			return encodeTag(0xa4, w.buffer);
		}
		case 5: {
			const w = new BerWriter();
			w.writeString(filter.attribute ?? "");
			w.writeString(filter.value ?? "");
			return encodeTag(0xa5, w.buffer);
		}
		case 6: {
			const w = new BerWriter();
			w.writeString(filter.attribute ?? "");
			w.writeString(filter.value ?? "");
			return encodeTag(0xa6, w.buffer);
		}
		case 7: {
			const w = new BerWriter();
			w.writeString(filter.attribute ?? "");
			return encodeTag(0xa7, w.buffer);
		}
		case 8: {
			const w = new BerWriter();
			w.writeString(filter.attribute ?? "");
			w.writeString(filter.value ?? "");
			return encodeTag(0xa8, w.buffer);
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
	const w = new BerWriter();
	w.startSequence();
	w.writeInt(id);
	w.startSequence(0xa4);
	w.writeString(dn);
	w.startSequence();
	for (const attr of attributes) {
		w.startSequence();
		w.writeString(attr.type);
		w.startSequence();
		for (const v of attr.vals) {
			w.writeString(v);
		}
		w.endSequence();
		w.endSequence();
	}
	w.endSequence();
	w.endSequence();
	w.endSequence();
	return w.buffer;
}

export function encodeBindResponse(id: number, resultCode: number, matchedDn: string, errorMessage: string): Buffer {
	const p = new BerWriter();
	p.writeInt(resultCode);
	p.writeString(matchedDn);
	p.writeString(errorMessage);
	return encodeLdapMessage(id, 1, p.buffer);
}

export function encodeSearchResultDone(id: number, resultCode: number): Buffer {
	const p = new BerWriter();
	p.writeInt(resultCode);
	p.writeString("");
	p.writeString("");
	return encodeLdapMessage(id, 5, p.buffer);
}
