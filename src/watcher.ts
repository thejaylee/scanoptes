import chalk from 'chalk';

import { consoleLogger as log } from './log.js';
import { PromiseFunc, WatchDefinition } from './types.js';
import { WebDocument } from './web-document.js';
import { UrlLoader } from './url-loader.js';
import { WebDocumentInspector } from './web-doc-inspector.js';

export class Watcher {
	#loader: UrlLoader;
	#document?: WebDocument;
	#inspector: WebDocumentInspector;
	#isCheckOutstanding: boolean;
	#timerId?: NodeJS.Timeout;
	#lastCheckResult: boolean;
	#lastPassedTime: Date | undefined;
	#sentinel?: Promise<Watcher>;
	#onPass?: PromiseFunc;
	#onFail?: PromiseFunc;

	name: string;
	description?: string;
	url: string;
	statusCodes?: number[];
	interval: number;
	stopOnPass: boolean;

	constructor(name: string, url: string, interval: number) {
		this.name = name;
		this.url = url;
		this.interval = interval;
		this.stopOnPass = false;
		this.#loader = new UrlLoader(url);
		this.#inspector = new WebDocumentInspector();
		this.#isCheckOutstanding = false;
		this.#lastCheckResult = false;
	}

	public static fromDefinition(definition: WatchDefinition): Watcher {
		let watcher: Watcher = new Watcher(definition.name, definition.url, definition.interval);
		watcher.description = definition.description;
		watcher.statusCodes = definition.statusCodes;
		watcher.#loader.headers = definition.headers ?? {};
		watcher.#inspector.loadNodeInspectorDefinitions(definition.all, definition.any);
		return watcher;
	}

	public async check(): Promise<boolean | undefined> {
		if (this.#isCheckOutstanding) {
			log.info(`check outstanding for ${this.name}`);
			return undefined;
		}

		log.info(`checking ${this.name} ${this.url}`);
		let statusCode: number;
		let buffer: Buffer;
		try {
			this.#isCheckOutstanding = true;
			[statusCode, buffer] = await this.#loader.load();
			log.trace('response data', buffer.toString());
		} catch (error) {
			this.#onFail?.call(null, this);
			throw error;
		} finally {
			this.#isCheckOutstanding = false;
		}

		this.#document = new WebDocument(buffer);
		let result: boolean = (this.statusCodes?.includes(statusCode) ?? false) && this.#inspector.inspect(this.#document);
		log.info(`${this.name} ${result ? chalk.green('passed') : chalk.red('failed')}`);
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
		log.trace(`starting watcher for ${this.name} @ ${this.interval}s`);
		this.updateSentinel();
		this.check();
		this.#timerId = setInterval(this.check.bind(this), this.interval * 1000);
	}

	public stop(): void {
		if (this.#timerId)
			clearInterval(this.#timerId);
	}
}
