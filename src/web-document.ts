import https from 'https';
import http from 'http';
import * as cheerio from 'cheerio';
import { Cheerio, Node } from 'cheerio';

import debug from './debug.js';
import { Pojo, PromiseFunc } from './types.js';

export class WebDocument {
	readonly url: string;
	cookie?: string;
	#requestLib: typeof http | typeof https;
	#buffer: Buffer | undefined;
	#$doc: cheerio.CheerioAPI | undefined;

	constructor(url: string) {
		this.url = url;
		if (!url.match(/^https?:\/\//i))
			throw new Error(`url "${url}" must begin with http:// or https://`);

		if (url.match(/^http:/i))
			this.#requestLib = http;
		else
			this.#requestLib = https;
	}

	public load(): Promise<WebDocument> {
		return new Promise((resolve: PromiseFunc, reject: PromiseFunc): void => {
			debug.trace(`loading ${this.url}`);

			const headers: Pojo = { 'accept-encoding': 'identity' };
			if (this.cookie)
				headers['cookie'] = this.cookie;

			this.#requestLib.get(this.url, { headers })
			.on('response', (response: any) => {
				debug.trace(`${this.url} response data`);
				let chunks: Buffer[] = [];
				response.on('data', (d: any): void => {
					chunks.push(d);
				}).on('end', () => {
					debug.trace(`${this.url} response end`);
					this.#buffer = Buffer.concat(chunks);
					this.#$doc = cheerio.load(this.#buffer.toString());
					resolve(this);
				});
			}).on('error', (error: Error): void => {
				debug.warn(`${this.url} response error: ${error}`);
				reject(error);
			});
		});
	}

	public get buffer(): Buffer | undefined {
		return this.#buffer;
	}

	public toString(encoding?: BufferEncoding): string | undefined {
		return this.#buffer ? this.#buffer.toString(encoding) : undefined;
	}

	public $(selector: string): Cheerio<Node> | undefined {
		if (this.#$doc)
			return this.#$doc(selector);
	}
}
