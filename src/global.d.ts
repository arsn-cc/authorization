declare module "*.css";

declare module "asn1" {
	interface BerWriterOptions {
		size?: number;
		growthFactor?: number;
	}

	class BerWriter {
		constructor(options?: BerWriterOptions);
		startSequence(tag?: number): void;
		endSequence(): void;
		writeInt(value: number, tag?: number): void;
		writeBoolean(value: boolean, tag?: number): void;
		writeString(value: string, tag?: number): void;
		writeBuffer(buf: Buffer, tag: number): void;
		writeNull(): void;
		writeByte(b: number): void;
		writeLength(len: number): void;
		writeOID(s: string, tag?: number): void;
		writeEnumeration(i: number, tag?: number): void;
		readonly buffer: Buffer;
	}

	class BerReader {
		constructor(data: Buffer);
		readSequence(tag?: number): number | null;
		readInt(tag?: number): number;
		readBoolean(): boolean;
		readString(tag?: number, retbuf?: boolean): string | Buffer | null;
		readOID(tag?: number): string;
		readEnumeration(): number;
		readByte(peek?: boolean): number | null;
		peek(): number | null;
		readLength(offset?: number): number | null;
		readonly length: number;
		readonly offset: number;
		readonly remain: number;
		readonly buffer: Buffer;
	}

	export const Ber: {
		readonly EOC: 0;
		readonly Boolean: 1;
		readonly Integer: 2;
		readonly BitString: 3;
		readonly OctetString: 4;
		readonly Null: 5;
		readonly OID: 6;
		readonly ObjectDescriptor: 7;
		readonly External: 8;
		readonly Real: 9;
		readonly Enumeration: 10;
		readonly PDV: 11;
		readonly Utf8String: 12;
		readonly RelativeOID: 13;
		readonly Sequence: 16;
		readonly Set: 17;
		readonly NumericString: 18;
		readonly PrintableString: 19;
		readonly T61String: 20;
		readonly VideotexString: 21;
		readonly IA5String: 22;
		readonly UTCTime: 23;
		readonly GeneralizedTime: 24;
		readonly GraphicString: 25;
		readonly VisibleString: 26;
		readonly GeneralString: 28;
		readonly UniversalString: 29;
		readonly CharacterString: 30;
		readonly BMPString: 31;
		readonly Constructor: 32;
		readonly Context: 128;
	};
}
