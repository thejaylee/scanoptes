import crypto from 'crypto';
import path from 'path';
import http from 'http';

import notifier from 'node-notifier';

import debug from './debug.js';
import { NotificationMessage } from './types.js';
import { open_url } from './util.js';
import { Aes256Cbc, Cryptor } from './crypto.js';

const DEFAULT_ICON_FILE = path.join(process.cwd(), 'notification_icon.png');
const icon: string = process.env.npm_package_config_icon_file ?? DEFAULT_ICON_FILE;

export interface Notifier {
	notify(message: NotificationMessage): void;
}

export class DesktopNotifier implements Notifier {
	public notify(message: NotificationMessage): void {
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
}

export class HttpPostNotifier implements Notifier {
	#cryptor: Cryptor;
	url: string;

	constructor(url: string, cryptor: Cryptor) {
		this.#cryptor = cryptor;
		this.url = url;
	}

	public notify(message: NotificationMessage): void {
		debug.trace(`posting message to ${this.url}`, message);

		const req = http.request(
			this.url,
			{ method: 'POST' },
			(res: http.IncomingMessage) => {
				if (res.statusCode != 201) {
					debug.warn(`[${res.statusCode}] failed to post notification message to ${this.url}`);
					return;
				}

				res.on('data', (chunk: Buffer) => {
					debug.trace('chunk', chunk.toString());
				});
				res.on('end', () => { debug.trace('no more data in response'); });
			}
		);

		req.on('error', error => {
			debug.warn(`could not post message: ${message.title}`, error);
		});

		debug.trace('sending message', message);
		req.write(JSON.stringify(this.#cryptor.encrypt(message)));
		req.end();
	}
}
