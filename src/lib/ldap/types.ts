export const LDAP_RESULT = {
	SUCCESS: 0,
	OPERATIONS_ERROR: 1,
	PROTOCOL_ERROR: 2,
	TIME_LIMIT_EXCEEDED: 3,
	SIZE_LIMIT_EXCEEDED: 4,
	AUTH_METHOD_NOT_SUPPORTED: 7,
	STRONGER_AUTH_REQUIRED: 8,
	NO_SUCH_OBJECT: 32,
	ALIAS_PROBLEM: 33,
	INVALID_DN_SYNTAX: 34,
	ENTRY_ALREADY_EXISTS: 68,
} as const;

export const LDAP_OP = {
	BIND_REQUEST: 0,
	BIND_RESPONSE: 1,
	UNBIND_REQUEST: 2,
	SEARCH_REQUEST: 3,
	SEARCH_RESULT_ENTRY: 4,
	SEARCH_RESULT_DONE: 5,
	MODIFY_REQUEST: 6,
	MODIFY_RESPONSE: 7,
	ADD_REQUEST: 8,
	ADD_RESPONSE: 9,
	DELETE_REQUEST: 10,
	DELETE_RESPONSE: 11,
	MODIFY_DN_REQUEST: 12,
	MODIFY_DN_RESPONSE: 13,
	COMPARE_REQUEST: 14,
	COMPARE_RESPONSE: 15,
	ABANDON_REQUEST: 16,
	SEARCH_RESULT_REFERENCE: 19,
	EXTENDED_REQUEST: 23,
	EXTENDED_RESPONSE: 24,
	INTERMEDIATE_RESPONSE: 25,
} as const;

export const LDAP_SCOPE = {
	BASE_OBJECT: 0,
	SINGLE_LEVEL: 1,
	WHOLE_SUBTREE: 2,
} as const;

export interface LdapSearchFilter {
	type: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
	attribute?: string;
	value?: string;
	filters?: LdapSearchFilter[];
	substrings?: Array<{ type: "initial" | "any" | "final"; value: string }>;
	matchingRule?: string;
	dnAttributes?: boolean;
}

export interface SearchResultEntryAttribute {
	type: string;
	vals: string[];
}

export interface LdapServerConfig {
	domain: string;
	port: number;
	adminDn: string;
	adminPassword: string;
	userObjectClass: string;
	groupObjectClass: string;
}
