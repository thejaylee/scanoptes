export type PromiseFunc = (...args: any[]) => void;
export type JsonObj = {[k:string]: any };
export type Pojo = {[k:string]: any };

export interface WatchDefinition {
	name: string;
	description?: string;
	url: string;
	interval: number;
	headers?: Pojo;
	statusCodes: number[],
	all?: NodeInspectorDefinition[];
	any?: NodeInspectorDefinition[];
}

export interface NodeInspectorDefinition {
	selector: string;
	context: "TEXT" | "HTML";
	name?: string;
	condition: {
		negated: boolean;
		anyChange?: string;
		caseSensitive?: string;
		includes?: string;
		match?: Array<string>[2];
		lessThan?: number;
	}
}

export interface NotificationMessage {
	title: string;
	body: string;
	url?: string;
}

export class TypeValidator {
	public static conformsTo(obj: object, definition: {[k: string]: string}): boolean {
		return Object.entries(obj).every(([key, _]): boolean => {
			return key in definition && typeof(key) == definition[key];
		})
	}

	public static conformsToNotificationMessage(obj: any) {
		return TypeValidator.conformsTo(obj, {
			title: 'string',
			body: 'string',
			url: 'string'
		});
	}
}
