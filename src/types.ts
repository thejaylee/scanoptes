export type PromiseFunc = (...args: any[]) => void;

//type ChildWatcherDefinitions = Omit<WatcherDefinition, 'url'>[];

interface WatchItem {
	element: string;
	caseSensitive?: boolean;
	parseNumber?: boolean;
	includes?: string;
	match?: string;
	lessThan?: number;
	anyChange?: boolean;
}

export interface WatcherDefinition {
	url: string;
	and?: WatchItem[];
	or?: WatchItem[];
}
