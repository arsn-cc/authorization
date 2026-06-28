export const RADIUS_CODE = {
	ACCESS_REQUEST: 1,
	ACCESS_ACCEPT: 2,
	ACCESS_REJECT: 3,
	ACCOUNTING_REQUEST: 4,
	ACCOUNTING_RESPONSE: 5,
	ACCESS_CHALLENGE: 11,
} as const;

export type RadiusCode = (typeof RADIUS_CODE)[keyof typeof RADIUS_CODE];

export const RADIUS_ATTR = {
	USER_NAME: 1,
	USER_PASSWORD: 2,
	CHAP_PASSWORD: 3,
	NAS_IP_ADDRESS: 4,
	NAS_PORT: 5,
	SERVICE_TYPE: 6,
	FRAMED_PROTOCOL: 7,
	FRAMED_IP_ADDRESS: 8,
	FRAMED_IP_NETMASK: 9,
	FRAMED_MTU: 12,
	REPLY_MESSAGE: 18,
	STATE: 24,
	CLASS: 25,
	VENDOR_SPECIFIC: 26,
	SESSION_TIMEOUT: 27,
	IDLE_TIMEOUT: 28,
	TERMINATION_ACTION: 29,
	CALLED_STATION_ID: 30,
	CALLING_STATION_ID: 31,
	NAS_IDENTIFIER: 32,
	PROXY_STATE: 33,
	ACCT_STATUS_TYPE: 40,
	ACCT_DELAY_TIME: 41,
	ACCT_INPUT_OCTETS: 42,
	ACCT_OUTPUT_OCTETS: 43,
	ACCT_SESSION_ID: 44,
	ACCT_AUTHENTIC: 45,
	ACCT_SESSION_TIME: 46,
	ACCT_INPUT_PACKETS: 47,
	ACCT_OUTPUT_PACKETS: 48,
	ACCT_TERMINATE_CAUSE: 49,
	EAP_MESSAGE: 79,
	MESSAGE_AUTHENTICATOR: 80,
	NAS_PORT_TYPE: 61,
	NAS_PORT_ID: 87,
	CHARGEABLE_USER_IDENTITY: 89,
} as const;

export interface RadiusAttribute {
	type: number;
	value: Buffer;
}

export interface RadiusPacket {
	code: RadiusCode;
	identifier: number;
	authenticator: Buffer;
	attributes: RadiusAttribute[];
}

export interface RadiusConfig {
	secret: string;
	authPort: number;
	acctPort: number;
}

export interface RadiusAuthResult {
	success: boolean;
	replyMessage?: string;
	sessionTimeout?: number;
}
