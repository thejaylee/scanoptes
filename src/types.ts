export type PromiseFunc = (...args: any[]) => void;
export type JsonObj = {[k:string]: any };
export type Pojo = {[k:string]: any };

export interface WatchDefinition {
	name: string;
	url: string;
	interval: number;
	cookie?: string;
	all?: NodeInspectorDefinition[];
	any?: NodeInspectorDefinition[];
}

export interface NodeInspectorDefinition {
	selector: string;
	context: "TEXT" | "HTML";
	name?: string;
	condition: {
		anyChange?: string;
		caseSensitive?: string;
		includes?: string;
		match?: Array<string>[2];
		lessThan?: number;
	}
}
