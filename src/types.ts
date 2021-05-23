export type PromiseFunc = (...args: any[]) => void;

export interface WatchItem {
	element: string;
	anyChange?: boolean;
	caseSensitive?: boolean;
	includes?: string;
	match?: RegExp;
	lessThan?: number;
}

export interface WatchDefinition {
	name: string;
	url: string;
	all?: WatchItem[];
	any?: WatchItem[];
}
