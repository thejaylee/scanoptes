import * as cheerio from 'cheerio';
import { Cheerio, Node } from 'cheerio';

export class WebDocument {
	#markup?: string;
	#$doc: cheerio.CheerioAPI | undefined;

	constructor(markup: string) {
		this.#markup = markup;
		this.#$doc = cheerio.load(markup);
	}

	public get markup() { return this.#markup; }

	public $(selector: string): Cheerio<Node> | undefined {
		if (this.#$doc)
			return this.#$doc(selector);
	}
}
