import http from 'http';
import https from 'https';
import * as cheerio from 'cheerio';

import debug, { DebugLevel } from './debug.js';
import { notify } from './notifier.js';
import { PromiseFunc, WatchDefinition, WatchItem } from './types.js';
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


debug.trace(process.env.npm_package_config_watches_file);
debug.trace(process.env.npm_package_config_scan_interval);
const watch_file: string = process.argv[2] ?? DEFAULT_WATCH_FILE;
const watches: WatchDefinition[] = load_watches(watch_file);
debug.trace(watches);

debug.info('starting up');
process_watches(watches);
debug.info('ending');

async function process_watches(watches: WatchDefinition[]): Promise<void> {
	let requests: Record<string, Promise<Buffer>> = {};
	for (const watch of watches) {
		let res_data: Buffer;
		debug.trace(`starting ${watch.name} (${watch.url})`);
		requests[watch.name] = make_request(watch.url).then((data: Buffer): Buffer => {
			const $root = cheerio.load(data.toString());

			debug.info(`checking ${watch.name}`);
			debug.info(`${watch.name}: ${check_page($root, watch)}`);
			
			return data;
		});
	}
	const resolutions: PromiseSettledResult<Buffer>[] = await Promise.allSettled(Object.values(requests));
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
			debug.trace(`${url} response data`);
			let chunks: Buffer[] = [];
			response.on('data', (d: any): void => {
				chunks.push(d);
			}).on('end', () => {
				debug.trace(`${url} response end`);
				resolve(Buffer.concat(chunks));
			});
		}).on('error', (error: Error): void => {
			debug.warn(`${url} response error: ${error}`);
			reject(error);
		});
	});
}

function check_page($root: any, watch: WatchDefinition): boolean {
	for (let wi of watch.all ?? []) {
		if (check_page_for_watch_item($root, wi) === false)
			return false;
	}

	for (let wi of watch.any ?? []) {
		if (check_page_for_watch_item($root, wi) === true)
			return true;
	}

	return true;
}

function check_page_for_watch_item($root: any, watch_item: WatchItem): boolean {
	const $el: cheerio.CheerioAPI = $root(watch_item.element);
	if (!$el)
		throw Error('could not find element');

	let text: string = watch_item.caseSensitive ? $el.text() : $el.text().toLowerCase();
	let num: number = Number(text.replace(/[^0-9\.]/g, ''));
	const includes: string | undefined = watch_item.caseSensitive ? watch_item.includes : watch_item.includes?.toLowerCase();

	if (includes && !text.includes(includes))
		return false;
	if (watch_item.match && !text.match(watch_item.match))
		return false;
	if (watch_item.lessThan && num >= watch_item.lessThan)
		return false;

	return true;
}
