import crypto from 'crypto';
import path from 'path';
import http from 'http';
import https from 'https';

import notifier from 'node-notifier';

import debug from './debug.js';
import { NotificationMessage } from './types.js';
import { open_url } from './util.js';
import { Aes256Cbc, Cryptor } from './crypto.js';

const DEFAULT_ICON_FILE = path.join(process.cwd(), 'notification_icon.png');
const icon: string = process.env.npm_package_config_icon_file ?? DEFAULT_ICON_FILE;

export class Notifier {
	#cryptor: Cryptor;

	constructor() {
		this.#cryptor = new Cryptor(new Aes256Cbc(crypto.randomBytes(16)));
	}

	public alertOnDesktop(message: NotificationMessage): void {
		notifier.notify({
			title: message.title,
			message: message.body,
			icon
		},
		(err, response, metadata) => {
			if (err || response != 'activate')
				return;

			if (message.url)
				open_url(message.url);
		});
	}

	public postToUrl(message: NotificationMessage, url: string): void {
		debug.trace(`posting message to ${url}`, message);
		const lib: typeof http | typeof https = url.match(/^https:/i) ? https : http;

		const req = lib.request(url, (res: http.IncomingMessage) => {
			if (res.statusCode != 201) {
				debug.warn(`[${res.statusCode}] failed to post notification message to ${url}`);
				return;
			}

			res.on('data', (chunk: Buffer) => {
				debug.trace('chunk', chunk.toString());
			});
			res.on('end', () => { debug.trace('no more data in response'); });
		});

		req.on('error', error => {
			debug.warn(`could not post message: ${message.title}`, error);
		});

		req.write(JSON.stringify(message));
		req.end();
	}
}
