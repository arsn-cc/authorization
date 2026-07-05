export interface ScimMeta {
	resourceType: "User" | "Group";
	created: string;
	lastModified: string;
	version: string;
	location?: string;
}

export interface ScimName {
	formatted?: string;
}

export interface ScimEmail {
	value: string;
	type?: string;
	primary?: boolean;
}

export interface ScimPhoto {
	value: string;
	type?: string;
}

export interface ScimUser {
	id: string;
	userName: string;
	name?: ScimName;
	displayName?: string;
	emails?: ScimEmail[];
	photos?: ScimPhoto[];
	timezone?: string;
	active?: boolean;
	meta: ScimMeta;
	schemas: string[];
}

export interface ScimMember {
	value: string;
	display?: string;
	$ref?: string;
}

export interface ScimGroup {
	id: string;
	displayName: string;
	members?: ScimMember[];
	meta: ScimMeta;
	schemas: string[];
}

export interface ScimListResponse<T> {
	Resources: T[];
	totalResults: number;
	itemsPerPage: number;
	startIndex: number;
	schemas: string[];
}

export interface ScimError {
	status: number;
	detail: string;
	schemas: string[];
}

export interface ScimOperation {
	op: "add" | "remove" | "replace";
	path?: string;
	value: unknown;
}

export interface ScimPatchRequest {
	schemas: string[];
	Operations: ScimOperation[];
}

export interface ScimSearchParams {
	filter?: string;
	sortBy?: string;
	sortOrder?: "ascending" | "descending";
	startIndex?: number;
	count?: number;
}
