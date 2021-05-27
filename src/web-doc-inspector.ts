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
	condition: {
		anyChange?: boolean;
		caseSensitive?: boolean;
		includes?: string;
		match?: RegExp;
		lessThan?: number;
	}
	#nodeHtml?: string;
	#nodeText?: string;

	constructor(selector: string, context: NodeInspectorContext = NodeInspectorContext.TEXT) {
		this.selector = selector;
		this.context = context;
		this.condition = {};
	}

	public static fromDefinition(definition: NodeInspectorDefinition): NodeInspector {
		const ni: NodeInspector = new NodeInspector(definition.selector, NodeInspectorContext[definition.context]);

		if (definition.name !== undefined)
			ni.name = String(definition.name);
		if (definition.condition.caseSensitive !== undefined)
			ni.condition.caseSensitive = Boolean(definition.condition.caseSensitive);
		if (definition.condition.anyChange !== undefined)
			ni.condition.anyChange = Boolean(definition.condition.anyChange);
		if (definition.condition.includes !== undefined)
			ni.condition.includes = String(definition.condition.includes);
		if (definition.condition.match !== undefined)
			ni.condition.match = new RegExp(definition.condition.match[0], definition.condition.match[1]);
		if (definition.condition.lessThan !== undefined)
			ni.condition.lessThan = Number(definition.condition.lessThan);

		return ni;
	}

	public inspect(document: WebDocument): boolean {
		debug.trace(`inspecting node ${this.selector}`);
		const $el: Cheerio<Node> | undefined = document.$(this.selector);
		if (!$el)
			throw Error('could not find element');

		let evaluatee: string;

		let oldHtml: string | undefined = this.#nodeHtml;
		let oldText: string | undefined = this.#nodeText;
		this.#nodeHtml = $el.html() ?? undefined;
		this.#nodeText = $el.text();

		switch (this.context) {
			case NodeInspectorContext.HTML:
				if (this.condition.anyChange)
					return oldHtml !== undefined && this.#nodeHtml != oldHtml;

				evaluatee = this.#nodeHtml ?? '';
				break;

			case NodeInspectorContext.TEXT:
				if (this.condition.anyChange)
					return oldText !== undefined && this.#nodeText != oldText;

				evaluatee = this.condition.caseSensitive ? this.#nodeText : this.#nodeText.toLowerCase();
				break;
		}

		let num: number = Number(evaluatee.replace(/[^0-9\.]/g, ''));
		const includes: string | undefined = this.condition.caseSensitive ? this.condition.includes : this.condition.includes?.toLowerCase();

		if (includes && !evaluatee.includes(includes))
			return false;
		if (this.condition.match && !evaluatee.match(this.condition.match))
			return false;
		if (this.condition.lessThan && num >= this.condition.lessThan)
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
