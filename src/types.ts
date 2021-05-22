export type PromiseFunc = (...args: any[]) => void;

export interface WatchItem {
	element: string;
	anyChange?: boolean;
	caseSensitive?: boolean;
	parseNumber?: boolean;
	includes?: string;
	match?: RegExp;
	lessThan?: number;
}

export interface WatchDefinition {
	name: string;
	url: string;
	and?: WatchItem[];
	or?: WatchItem[];
}
