import http from 'http';
import https from 'https';
import * as cheerio from 'cheerio';

import debug, { DebugLevel } from './debug.js';
import { notify } from './notifier.js';
import { PromiseFunc, WatcherDefinition } from './types.js';

process.on('unhandledRejection', console.log);

const NODE_ENV : string | undefined = process.env.NODE_ENV;

let debug_levels: DebugLevel[] = [debug.LEVEL.warn, debug.LEVEL.error];
switch (NODE_ENV) {
	case 'debug':
		debug_levels = debug_levels.concat([debug.LEVEL.info, debug.LEVEL.trace]);
		break;
}
debug.setLevel(debug_levels);

debug.info('starting up');

let sel1224g: WatcherDefinition = {
	url: 'https://www.amazon.ca/Sony-SEL1224G-12-24mm-Fixed-Camera/dp/B072J4B6WS/',
	and: [{
		element: '.olp-text-box',
		includes: 'New & Used',
	},{
		element: '.olp-text-box .a-size-base',
		lessThan: 1700,
	}]
}

process_watcher(sel1224g);

async function process_watcher(watcher: WatcherDefinition): Promise<void> {
	let res_data: Buffer;
	res_data = await make_request(watcher.url);
	let $root = cheerio.load(res_data.toString());
	debug.info(check_page($root, watcher));
}

function check_page($root: any, watcher: WatcherDefinition): boolean {
	for (let w of watcher.and ?? []) {
		const $el = $root(w.element);
		if (!$el)
			throw Error('could not find element');

		let text: string = w.caseSensitive ? $el.text() : $el.text().toLowerCase();
		let num: number = Number(text.replace(/[^0-9\.]/g, ''));
		const includes: string | undefined = w.caseSensitive ? w.includes : w.includes?.toLowerCase();

		if (includes && !text.includes(includes))
			return false;
		if (w.match && !text.match(new RegExp(w.match)))
			return false;
		if (w.lessThan && num >= w.lessThan)
			return false;
	}
	return true;
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

debug.info('ending');
