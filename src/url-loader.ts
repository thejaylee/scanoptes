import https from 'https';
import http from 'http';

import log from './log.js';
import { Pojo, PromiseFunc } from './types.js';

export class UrlLoader {
	#url: string;
	#headers: Pojo;

	constructor(url: string) {
		if (!url.match(/^https?:\/\//i))
			throw new Error(`url "${url}" must begin with http:// or https://`);

		this.#url = url;
		this.#headers = {
			'User-Agent': 'scanoptes',
			Accept: '*/*',
			'Accept-Encoding': 'identity',
		};
	}

	get headers() { return this.#headers; }
	set headers(headers: Pojo) {
		this.#headers = {
			'User-Agent': 'scanoptes',
			...headers,
			Accept: '*/*',
			'Accept-Encoding': 'identity',
		};
	}

	public load(): Promise<[number, Buffer]> {
		return new Promise((resolve: PromiseFunc, reject: PromiseFunc): void => {
			log.debug(`requesting ${this.#url}`);

			const lib: typeof http | typeof https = this.#url.match(/^https:/i) ? https : http;

			const headers: Pojo = {
				'User-Agent': 'scanoptes',
				...this.headers,
				Accept: '*/*',
				'Accept-Encoding': 'identity',
			};
			log.trace(`${this.#url} request headers`, headers);

			lib.get(this.#url, { headers })
			.on('response', (response: any) => {
				log.debug(`${this.#url} returned ${response.statusCode}`);
				let chunks: Buffer[] = [];
				response.on('data', (d: any): void => {
					chunks.push(d);
				}).on('end', () => {
					const buffer = Buffer.concat(chunks);
					log.debug(`${this.#url} response length: ${buffer.length}`);
					resolve([response.statusCode, buffer]);
				});
			}).on('error', (error: Error): void => {
				log.warn(`${this.#url} response error: ${error}`);
				reject(error);
			});
		});
	}
}