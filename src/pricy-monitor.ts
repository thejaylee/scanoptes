import debug from './debug.js';
import { notify } from './notifier.js';
import http from 'http';
import https from 'https';

process.on('unhandledRejection', console.log);

const NODE_ENV : string | undefined = process.env.NODE_ENV;

debug.info('starting up');

type PromiseFunc = (...args: any[]) => void;

// https://www.amazon.ca/Sony-SEL1224G-12-24mm-Fixed-Camera/dp/B072J4B6WS/
let res_data: Buffer;
res_data = await make_request('https://www.google.ca/');
debug.trace(res_data.toString());

function make_request(url: string): Promise<Buffer> {
	debug.trace(`making request to ${url}`);

	return new Promise((resolve: PromiseFunc, reject: PromiseFunc): void => {
		https.get(url)
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
