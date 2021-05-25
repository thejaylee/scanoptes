import fs from 'fs';
import { Cheerio, Node } from 'cheerio';

import debug from './debug.js';
import { PromiseFunc, WatchDefinition, NodeInspectorDefinition } from './types.js';
import { WebDocument } from './web-document.js';
import { WebDocumentInspector, NodeInspector } from './web-doc-inspector.js';

export class Watcher {
	#document: WebDocument;
	#inspector: WebDocumentInspector;
	#isCheckOutstanding: boolean;
	#timerId?: NodeJS.Timeout;
	#lastCheckResult: boolean;
	#lastPassedTime: Date | undefined;
	#sentinel?: Promise<Watcher>;
	#onPass?: PromiseFunc;
	#onFail?: PromiseFunc;

	name: string;
	url: string;
	interval: number;
	stopOnPass: boolean;

	constructor(name: string, url: string, interval: number) {
		this.name = name;
		this.url = url;
		this.interval = interval;
		this.stopOnPass = false;
		this.#document = new WebDocument(url);
		this.#inspector = new WebDocumentInspector(this.#document);
		this.#isCheckOutstanding = false;
		this.#lastCheckResult = false;
	}

	public static fromDefinition(definition: WatchDefinition): Watcher {
		let watcher: Watcher = new Watcher(definition.name, definition.url, definition.interval);
		watcher.#inspector.loadNodeInspectorDefinitions(definition.all, definition.any);
		return watcher;
	}

	public async check(): Promise<boolean | undefined> {
		if (this.#isCheckOutstanding) {
			debug.trace(`check outstanding for ${this.name}`);
			return undefined;
		}

		debug.info(`checking ${this.name} ${this.url}`);
		try {
			this.#isCheckOutstanding = true;
			await this.#document.load();
		} catch (error) {
			this.#onFail?.call(null, this);
			throw error;
		} finally {
			this.#isCheckOutstanding = false;
		}

		let result: boolean = this.#inspector.inspect();
		if (result === true && this.#lastCheckResult !== result) {
			this.#lastPassedTime = new Date();
			this.#onPass?.call(null, this);
			if (this.stopOnPass)
				this.stop();
			else
				this.updateSentinel();
		}
		this.#lastCheckResult = result;
		return result;
	}

	protected updateSentinel(): void {
		this.#sentinel = new Promise((res: PromiseFunc, rej: PromiseFunc): void => {
			this.#onPass = res;
			this.#onFail = rej;
		});

	}

	get sentinel(): Promise<Watcher> | undefined {
		return this.#sentinel;
	}

	public start(): void {
		debug.trace(`starting watcher for ${this.name} @ ${this.interval}s`);
		this.updateSentinel();
		this.check();
		this.#timerId = setInterval(this.check.bind(this), this.interval * 1000);
	}

	public stop(): void {
		if (this.#timerId)
			clearInterval(this.#timerId);
	}
}
