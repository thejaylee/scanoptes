import https from 'https';
import * as cheerio from 'cheerio';
import { Cheerio, Node } from 'cheerio';

import debug from './debug.js';
import { PromiseFunc } from './types.js';

export class WebDocument {
 	readonly url: string;
	#buffer: Buffer | undefined;
	#$doc: cheerio.CheerioAPI | undefined;

	constructor(url: string) {
		this.url = url;
	}

	public load(): Promise<WebDocument> {
		return new Promise((resolve: PromiseFunc, reject: PromiseFunc): void => {
			https.get(this.url, {
				headers: {
					'accept-encoding': 'identity',
				},
			})
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
