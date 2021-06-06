import https from 'https';
import http from 'http';
import * as cheerio from 'cheerio';
import { Cheerio, Node } from 'cheerio';

import log from './log.js';
import { Pojo, PromiseFunc } from './types.js';

export class WebDocument {
	#buffer?: Buffer;
	#$doc: cheerio.CheerioAPI | undefined;

	constructor(buffer: Buffer) {
		this.#buffer = buffer;
		this.#$doc = cheerio.load(buffer.toString());
	}

	public get buffer() { return this.#buffer; }

	public toString(encoding?: BufferEncoding): string | undefined {
		return this.#buffer ? this.#buffer.toString(encoding) : undefined;
	}

	public $(selector: string): Cheerio<Node> | undefined {
		if (this.#$doc)
			return this.#$doc(selector);
	}
}
