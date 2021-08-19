import { Cheerio, Node } from 'cheerio';

import log from './log.js';
import { NodeInspectorDefinition } from './types.js';
import { WebDocument } from './web-document.js';

export class WebDocumentInspector {
	all: NodeInspector[];
	any: NodeInspector[];

	constructor() {
		this.all = [];
		this.any = [];
	}

	public loadNodeInspectorDefinitions(all?: NodeInspectorDefinition[], any?: NodeInspectorDefinition[]): void {
		for (let d of all ?? [])
			this.all.push(NodeInspector.fromDefinition(d));
		for (let d of any ?? [])
			this.any.push(NodeInspector.fromDefinition(d));
	}

	public inspect(document: WebDocument): boolean {
		for (let ni of this.all ?? []) {
			return ni.inspect(document);
		}

		for (let ni of this.any ?? []) {
			if (ni.inspect(document))
				break;
		}

		return true;
	}
}

enum NodeInspectorContext {
	TEXT = 'text',
	HTML = 'html',
};

enum ComparisonOperator {
	EQ = 'eq',
	NE = 'ne',
	LT = 'lt',
	LTE = 'lte',
	GT = 'gt',
	GTE = 'gte',
	INC = 'inc',
}

export class NodeInspector {
	selector: string;
	context: NodeInspectorContext;
	name?: string;
	condition: {
		operator?: ComparisonOperator;
		operand?: string | number;
		negated?: boolean;
		match?: RegExp;
		anyChange?: boolean;
		caseSensitive?: boolean;
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
		if (definition.condition.operator !== undefined)
			ni.condition.operator = String(definition.condition.operator) as ComparisonOperator;
		if (definition.condition.operand !== undefined)
			ni.condition.operand = definition.condition.operand;
		if (definition.condition.negated !== undefined)
			ni.condition.negated = Boolean(definition.condition.negated);
		if (definition.condition.match !== undefined)
			ni.condition.match = new RegExp(definition.condition.match[0], definition.condition.match[1]);
		if (definition.condition.caseSensitive !== undefined)
			ni.condition.caseSensitive = Boolean(definition.condition.caseSensitive);
		if (definition.condition.anyChange !== undefined)
			ni.condition.anyChange = Boolean(definition.condition.anyChange);

		return ni;
	}

	public inspect(document: WebDocument): boolean {
		log.debug(`inspecting node ${this.selector}`);
		const $el: Cheerio<Node> | undefined = document.$(this.selector);
		if (!$el)
			throw Error('Cheerio failed');
		log.trace(this.selector, $el);

		const isNegated = Boolean(this.condition.negated);
		let evaluatee: string;
		let includes: string | undefined = this.condition.operator === ComparisonOperator.INC ? String(this.condition.operand) : undefined;

		let oldHtml: string | undefined = this.#nodeHtml;
		let oldText: string | undefined = this.#nodeText;
		this.#nodeHtml = $el.html() ?? undefined;
		this.#nodeText = $el.text();
		log.trace(`${this.selector} html:`, this.#nodeHtml);
		log.trace(`${this.selector} text:`, this.#nodeText);

		switch (this.context) {
			case NodeInspectorContext.HTML:
				if (this.condition.anyChange)
					return isNegated !== (oldHtml !== undefined && this.#nodeHtml != oldHtml);

				evaluatee = this.#nodeHtml ?? '';
				break;

			case NodeInspectorContext.TEXT:
				if (this.condition.anyChange)
					return isNegated !== (oldText !== undefined && this.#nodeText != oldText);

				evaluatee = this.#nodeText;
				break;
		}

		log.trace(evaluatee.replace(/[^0-9\.]/g, ''));
		let num: number = Number(evaluatee.replace(/[^0-9\.]/g, ''));
		log.trace(`${this.selector} evaluatee: ${evaluatee}`);
		log.trace(`${this.selector} num: ${num}`);
		if (!this.condition.caseSensitive) {
			evaluatee = evaluatee.toLowerCase();
			includes = includes?.toLowerCase();
		}

		if (this.condition.operand) {
			switch (this.condition.operator) {
				case ComparisonOperator.EQ:
					return isNegated !== (evaluatee == this.condition.operand);

				case ComparisonOperator.NE:
					return isNegated !== (evaluatee != this.condition.operand);

				case ComparisonOperator.LT:
					return isNegated !== (num < this.condition.operand);

				case ComparisonOperator.LTE:
					return isNegated !== (num <= this.condition.operand);

				case ComparisonOperator.GT:
					return isNegated !== (num > this.condition.operand);

				case ComparisonOperator.GTE:
					return isNegated !== (num >= this.condition.operand);

				case ComparisonOperator.INC:
					return isNegated !== (includes && evaluatee.includes(includes));
			}
		}
		if (this.condition.match && !evaluatee.match(this.condition.match))
			return false !== isNegated;

		return true !== isNegated;
	}

	public get nodeHtml(): string | undefined {
		return this.#nodeHtml;
	}

	public get nodeText(): string | undefined {
		return this.#nodeText;
	}
}
