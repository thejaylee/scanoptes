import fs from 'fs';
import { Cheerio, Node } from 'cheerio';

import debug from './debug.js';
import { JsonObj } from './types.js';
import { WebDocument } from './web-document.js';

export function load_watches_file(filepath: string): Watcher[] {
	const contents: string = fs.readFileSync(filepath, { encoding: 'utf-8' });
	const json_defs: Array<WatchDefinition> = JSON.parse(contents);
	debug.trace('watch definitions', json_defs);
	const watches: Watcher[] = [];

	for (let j of json_defs) {
		debug.trace('processing definition', j);
		watches.push(Watcher.fromDefinition(j));
	}
	return watches;
}

export interface WatchDefinition {
	name: string;
	url: string;
	all?: WatchElementDefinition[];
	any?: WatchElementDefinition[];
}

export interface WatchElementDefinition {
	selector: string;
	name?: string;
	shouldTrack?: string;
	anyChange?: string;
	caseSensitive?: string;
	includes?: string;
	match?: Array<string>[2];
	lessThan?: number;
}

export class Watcher {
	name: string;
	url: string;
	all: WatchElement[];
	any: WatchElement[];
	#webDoc: WebDocument;
	#isCheckOutstanding: boolean;
	#timerId?: NodeJS.Timeout;

	constructor(name: string, url: string) {
		this.name = name;
		this.url = url;
		this.#webDoc = new WebDocument(url);
		this.#isCheckOutstanding = false;
		this.all = [];
		this.any = [];
	}

	public static fromDefinition(watchDef: WatchDefinition): Watcher {
		let watcher: Watcher = new Watcher(watchDef.name, watchDef.url);

		for (let d of watchDef.all ?? []) {
			debug.trace(d);
			watcher.all.push(WatchElement.fromDefinition(d));
		}
		for (let d of watchDef.any ?? []) {
			watcher.any.push(WatchElement.fromDefinition(d));
		}

		return watcher;
	}

	public async check(): Promise<boolean | undefined> {
		if (this.#isCheckOutstanding) {
			debug.trace(`check outstanding for ${this.name}`);
			return undefined;
		}

		debug.info(`loading ${this.name} ${this.url}`);
		try {
			this.#isCheckOutstanding = true;
			await this.#webDoc.load();
		} catch (error) {
			throw error;
		} finally {
			this.#isCheckOutstanding = false;
		}

		debug.info(`checking ${this.name}`);
		for (let wi of this.all ?? []) {
			if (!wi.check(this.#webDoc))
				return false;
		}

		for (let wi of this.any ?? []) {
			if (!wi.check(this.#webDoc))
				return false;
		}

		return true;
	}

	public start(interval: number): void {
		debug.trace(`starting watcher for ${this.name} @ ${interval}s`);
		this.check();
		this.#timerId = setInterval(this.check.bind(this), interval * 1000);
	}

	public stop(): void {
		if (this.#timerId)
			clearInterval(this.#timerId);
	}
}

export class WatchElement {
	selector: string;
	name?: string;
	shouldTrack?: boolean;
	anyChange?: boolean;
	caseSensitive?: boolean;
	includes?: string;
	match?: RegExp;
	lessThan?: number;

	constructor(selector: string) {
		this.selector = selector;
	}

	public static fromDefinition(weDef: WatchElementDefinition): WatchElement {
		const watchElement: WatchElement = new WatchElement(weDef.selector);

		if (weDef.name !== undefined)
			watchElement.name = String(weDef.name);
		if (weDef.shouldTrack !== undefined)
			watchElement.shouldTrack = Boolean(weDef.shouldTrack);
		if (weDef.anyChange !== undefined)
			watchElement.anyChange = Boolean(weDef.anyChange);
		if (weDef.caseSensitive !== undefined)
			watchElement.caseSensitive = Boolean(weDef.caseSensitive);
		if (weDef.includes !== undefined)
			watchElement.includes = String(weDef.includes);
		if (weDef.match !== undefined)
			watchElement.match = new RegExp(weDef.match[0], weDef.match?.[1]);
		if (weDef.lessThan !== undefined)
			watchElement.lessThan = Number(weDef.lessThan);

		debug.trace(watchElement);
		return watchElement;
	}

	public check(webDoc: WebDocument): boolean {
		const $el: Cheerio<Node> | undefined = webDoc.$(this.selector);
		if (!$el)
			throw Error('could not find element');

		let text: string = this.caseSensitive ? $el.text() : $el.text().toLowerCase();
		let num: number = Number(text.replace(/[^0-9\.]/g, ''));
		const includes: string | undefined = this.caseSensitive ? this.includes : this.includes?.toLowerCase();

		if (includes && !text.includes(includes))
			return false;
		if (this.match && !text.match(this.match))
			return false;
		if (this.lessThan && num >= this.lessThan)
			return false;

		return true;
	}
}
