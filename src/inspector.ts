import { Cheerio, Node } from 'cheerio';

import { consoleLogger as log } from './log.js';
import { NodeInspectorDefinition } from './types.js';
import { WebDocument } from './web-document.js';

export class NoNodeInspectorError extends Error {
	constructor(...params: any[]) {
		super(...params);
		this.name = 'NoNodeInspectorError';
		this.message = 'No NodeInspectors set for WebDocumentInspector';
	}
}

export class WebDocumentInspector {
	all: NodeInspector[];
	any: NodeInspector[];

	constructor() {
		this.all = [];
		this.any = [];
	}

	public loadNodeInspectorDefinitions(
		{all, any}: {all?: NodeInspectorDefinition[], any?: NodeInspectorDefinition[]}
	): void {
		for (let d of all ?? [])
			this.all.push(NodeInspector.fromDefinition(d));
		for (let d of any ?? [])
			this.any.push(NodeInspector.fromDefinition(d));
	}

	public inspect(doc: WebDocument): boolean {
		if (this.all.length + this.any.length <= 0)
			throw new NoNodeInspectorError();

		return this.anyMatch(doc) && this.allMatch(doc);
	}
	
	private allMatch(doc: WebDocument): boolean {
		for (let ni of this.all ?? []) {
			if (!ni.inspect(doc))
				return false;
		}
		
		return true;
	}

	private anyMatch(doc: WebDocument): boolean {
		for (let ni of this.any ?? []) {
			if (ni.inspect(doc))
				return true;
		}

		return this.any.length <= 0;
	}
}

export enum NodeInspectorContext {
	TEXT = 'text',
	HTML = 'html',
};

export enum ComparisonOperator {
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
	#node?: Cheerio<Node>;

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
		const $node: Cheerio<Node> | undefined = document.$(this.selector);
		if (!$node)
			throw Error('Cheerio failed');
		log.trace(this.selector, $node);

		const isNegated = Boolean(this.condition.negated);
		if ($node.length <= 0)
			return isNegated !== false;

		let evaluatee: string | number;
		let includes = this.condition.operator === ComparisonOperator.INC ? String(this.condition.operand) : undefined;
		let operand = this.condition.operand;

		let oldHtml = this.#node?.html();
		let oldText = this.#node?.text();
		const html = $node.html() ?? '';
		const text = $node.text();
		this.#node = $node;
		log.trace(`${this.selector} html:`, html);
		log.trace(`${this.selector} text:`, text);

		switch (this.context) {
			case NodeInspectorContext.HTML:
				if (this.condition.anyChange)
					return isNegated !== Boolean(oldHtml && html != oldHtml);

				evaluatee = html;
				break;

			case NodeInspectorContext.TEXT:
				if (this.condition.anyChange)
					return isNegated !== Boolean(oldText && text != oldText);

				evaluatee = text;
				break;
		}

		if (typeof(operand) === 'number')
			evaluatee = Number(evaluatee.replace(/[^0-9\.]/g, ''));
		if (!this.condition.caseSensitive && typeof(operand) === 'string') {
			operand = operand.toLowerCase();
			evaluatee = String(evaluatee).toLowerCase();
			includes = includes?.toLowerCase();
		}
		log.trace(`${this.selector} evaluatee: ${evaluatee}`);

		if (operand) {
			switch (this.condition.operator) {
				case ComparisonOperator.EQ:
					return isNegated !== (evaluatee == operand);

				case ComparisonOperator.NE:
					return isNegated !== (evaluatee != operand);

				case ComparisonOperator.LT:
					return isNegated !== (evaluatee < operand);

				case ComparisonOperator.LTE:
					return isNegated !== (evaluatee <= operand);

				case ComparisonOperator.GT:
					return isNegated !== (evaluatee > operand);

				case ComparisonOperator.GTE:
					return isNegated !== (evaluatee >= operand);

				case ComparisonOperator.INC:
					return isNegated !== (includes && String(evaluatee).includes(includes));
			}
		}
		if (this.condition.match && !String(evaluatee).match(this.condition.match))
			return false !== isNegated;

		return isNegated !== true;
	}

	public get nodeHtml(): string | undefined {
		return this.#node?.html() || undefined;
	}

	public get nodeText(): string | undefined {
		return this.#node?.text() || undefined;
	}
}
