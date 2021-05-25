import fs from 'fs';
import { Cheerio, Node } from 'cheerio';

import debug from './debug.js';
import { NodeInspectorDefinition } from './types.js';
import { WebDocument } from './web-document.js';

export class WebDocumentInspector {
	#document: WebDocument;
	all: NodeInspector[];
	any: NodeInspector[];

	constructor(document: WebDocument) {
		this.all = [];
		this.any = [];
		this.#document = document;
	}

    public loadNodeInspectorDefinitions(all?: NodeInspectorDefinition[], any?: NodeInspectorDefinition[]): void {
		for (let d of all ?? [])
			this.all.push(NodeInspector.fromDefinition(d));
		for (let d of any ?? [])
			this.any.push(NodeInspector.fromDefinition(d));
    }

	public inspect(): boolean {
		debug.info(`inspecting ${this.#document.url}`);
		for (let ni of this.all ?? []) {
			if (!ni.inspect(this.#document))
				return false;
		}

		for (let ni of this.any ?? []) {
			if (ni.inspect(this.#document))
				break;
		}

		return true;
	}
}

enum NodeInspectorContext {
	TEXT = 'text',
	HTML = 'html',
};

export class NodeInspector {
	selector: string;
	context: NodeInspectorContext;
	name?: string;
	anyChange?: boolean;
	caseSensitive?: boolean;
	includes?: string;
	match?: RegExp;
	lessThan?: number;
	#nodeHtml?: string;
	#nodeText?: string;

	constructor(selector: string, context: NodeInspectorContext = NodeInspectorContext.TEXT) {
		this.selector = selector;
		this.context = context;
	}

	public static fromDefinition(niDef: NodeInspectorDefinition): NodeInspector {
		const ni: NodeInspector = new NodeInspector(niDef.selector, NodeInspectorContext[niDef.context]);

		if (niDef.name !== undefined)
			ni.name = String(niDef.name);
		if (niDef.caseSensitive !== undefined)
			ni.caseSensitive = Boolean(niDef.caseSensitive);
		if (niDef.includes !== undefined)
			ni.includes = String(niDef.includes);
		if (niDef.match !== undefined)
			ni.match = new RegExp(niDef.match[0], niDef.match[1]);
		if (niDef.lessThan !== undefined)
			ni.lessThan = Number(niDef.lessThan);

		return ni;
	}

	public inspect(document: WebDocument): boolean {
        debug.trace(`inspecting node ${this.selector}`);
		const $el: Cheerio<Node> | undefined = document.$(this.selector);
		if (!$el)
			throw Error('could not find element');

		let evaluatee: string;

		this.#nodeHtml = $el.html() ?? undefined;
		this.#nodeText = $el.text();
		switch (this.context) {
			case NodeInspectorContext.TEXT:
				evaluatee = this.caseSensitive ? this.#nodeText : this.#nodeText.toLowerCase();
				break;

			case NodeInspectorContext.HTML:
				evaluatee = this.#nodeHtml ?? '';
				break;
		}

		let num: number = Number(evaluatee.replace(/[^0-9\.]/g, ''));
		const includes: string | undefined = this.caseSensitive ? this.includes : this.includes?.toLowerCase();

		if (includes && !evaluatee.includes(includes))
			return false;
		if (this.match && !evaluatee.match(this.match))
			return false;
		if (this.lessThan && num >= this.lessThan)
			return false;

		return true;
	}

	public get nodeHtml(): string | undefined {
		return this.#nodeHtml;
	}

	public get nodeText(): string | undefined {
		return this.#nodeText;
	}
}
