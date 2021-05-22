import http from 'http';
import https from 'https';
import * as cheerio from 'cheerio';

import debug, { DebugLevel } from './debug.js';
import { notify } from './notifier.js';
import { PromiseFunc, WatchDefinition } from './types.js';
import { load_watches } from './watch_loader.js';

process.on('unhandledRejection', console.log);

const DEFAULT_WATCH_FILE = 'watches.json'
const NODE_ENV : string | undefined = process.env.NODE_ENV;

let debug_levels: DebugLevel[] = [debug.LEVEL.warn, debug.LEVEL.error];
switch (NODE_ENV) {
	case 'debug':
		debug_levels = debug_levels.concat([debug.LEVEL.info, debug.LEVEL.trace]);
		break;
}
debug.setLevel(debug_levels);

const watch_file: string = process.argv[2] ?? DEFAULT_WATCH_FILE;
const watches: WatchDefinition[] = load_watches(watch_file);
debug.trace(watches);

debug.info('starting up');
process_watches(watches);
debug.info('ending');

async function process_watches(watches: WatchDefinition[]): Promise<void> {
	for (const watch of watches) {
		let res_data: Buffer;
		res_data = await make_request(watch.url);
		let $root = cheerio.load(res_data.toString());
		debug.info(check_page($root, watch));
	}
}

function make_request(url: string): Promise<Buffer> {
	debug.trace(`making request to ${url}`);

	return new Promise((resolve: PromiseFunc, reject: PromiseFunc): void => {
		https.get(url, {
			headers: {
				'accept-encoding': 'identity',
			},
		})
		.on('response', (response: any) => {
			debug.trace('response');
			let chunks: Buffer[] = [];
			response.on('data', (d: any): void => {
				chunks.push(d);
			}).on('end', () => {
				debug.trace('response end');
				resolve(Buffer.concat(chunks));
			});
		}).on('error', (error: Error): void => {
			debug.warn(`response error: ${error}`);
			reject(error);
		});
	});
}

function check_page($root: any, watch: WatchDefinition): boolean {
	for (let w of watch.and ?? []) {
		const $el: cheerio.CheerioAPI = $root(w.element);
		if (!$el)
			throw Error('could not find element');

		let text: string = w.caseSensitive ? $el.text() : $el.text().toLowerCase();
		let num: number = Number(text.replace(/[^0-9\.]/g, ''));
		const includes: string | undefined = w.caseSensitive ? w.includes : w.includes?.toLowerCase();

		if (includes && !text.includes(includes))
			return false;
		if (w.match && !text.match(w.match))
			return false;
		if (w.lessThan && num >= w.lessThan)
			return false;
	}
	return true;
}
