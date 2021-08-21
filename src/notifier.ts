import path from 'path';
import http from 'http';

import notifier from 'node-notifier';

import { consoleLogger as log } from './log.js';
import { NotificationMessage } from './types.js';
import { open_url } from './util.js';
import { Cryptor } from './crypto.js';

const HTTP_REQUEST_TIMEOUT = 10000; // millis

const DEFAULT_ICON_FILE = path.join(process.cwd(), 'notification_icon.png');
const icon: string = process.env.npm_package_config_icon_file ?? DEFAULT_ICON_FILE;

export interface Notifier {
	notify(message: NotificationMessage): Promise<void>;
}

export interface RetryNotifier extends Notifier {
	notifyWithRetry(message: NotificationMessage): Promise<void>;
	setRetries(interval: number, count: number): void;
}

interface NotificationRetryItem {
	time: number;
	attempts: number;
	message: NotificationMessage;
}

abstract class AbstractRetryNotifier implements RetryNotifier {
	#retryInterval?: number;
	#retryCount?: number;
	#retryQueue: NotificationRetryItem[];
	#timer?: NodeJS.Timeout;

	constructor() {
		this.#retryQueue = [];
	}

	abstract notify(message: NotificationMessage): Promise<void>;

	public async notifyWithRetry(message: NotificationMessage): Promise<void> {
		try {
			return await this.notify(message);
		} catch (error) {
			if ((this.#retryInterval ?? 0) > 0 && (this.#retryCount ?? 0) > 0) {
				log.warn(`notification for message "${message.title}" failed. retrying ${this.#retryCount} times every ${this.#retryInterval}s`);
				this.addMessageForRetry(message);
			}
			throw error;
		}
	}

	public setRetries(interval: number, count: number): void {
		this.#retryInterval = interval;
		this.#retryCount = count;
		this.startRetryTimer();
	}

	protected addMessageForRetry(message: NotificationMessage): void {
		if (!this.#retryInterval || !this.#retryCount)
			return;

		this.#retryQueue.push({
			time: Date.now() + this.#retryInterval * 1000,
			attempts: 0,
			message,
		});
		this.startRetryTimer();
	}

	private startRetryTimer(): void {
		if (!this.#retryInterval)
			return;
		if (this.#retryQueue.length < 1)
			return;

		if (this.#timer)
			clearTimeout(this.#timer);
		this.#timer = setTimeout(this.nextRetry.bind(this), this.#retryQueue[0].time - Date.now());
	}

	private async nextRetry() {
		const retry = this.#retryQueue.shift() as NotificationRetryItem;
		try {
			await this.notify(retry.message);
		} catch (error) {
			retry.attempts++;
			log.warn(`notification attempt ${retry.attempts} for message "${retry.message.title}" failed`);
			if (!this.#retryInterval || retry.attempts >= (this.#retryCount ?? 0))
				return;

			retry.time = Date.now() + this.#retryInterval * 1000;
			this.#retryQueue.push(retry);
			this.startRetryTimer();
		}
	}
}

export class DesktopNotifier extends AbstractRetryNotifier implements Notifier {
	public notify(message: NotificationMessage): Promise<void> {
		return new Promise((resolve, reject) => {
			notifier.notify({
				title: message.title,
				message: message.body,
				icon
			},
			(err, response, metadata) => {
				if (err || response === 'timeout')
					return reject();
				else
					resolve();

				if (response === 'activate' && message.url)
					open_url(message.url);
			});
		});
	}
}

export class HttpPostNotifier extends AbstractRetryNotifier implements Notifier {
	#cryptor: Cryptor;
	url: string;

	constructor(url: string, cryptor: Cryptor) {
		super();
		this.#cryptor = cryptor;
		this.url = url;
	}

	public notify(message: NotificationMessage): Promise<void> {
		log.trace(`posting message to ${this.url}`, message);

		return new Promise((resolve, reject) => {
			const req = http.request(
				this.url,
				{
					method: 'POST',
					timeout: HTTP_REQUEST_TIMEOUT,
				},
				(res: http.IncomingMessage) => {
					if (res.statusCode != 201) {
						log.warn(`[${res.statusCode}] failed to post notification message to ${this.url}`);
						reject();
						return;
					} else {
						resolve();
					}

					res.on('data', (chunk: Buffer) => {
						log.trace('chunk', chunk.toString());
					});
					res.on('end', () => { log.trace('no more data in response'); });
				}
			);

			req.on('error', error => {
				log.warn(`could not post message "${message.title}"`, error);
				reject();
			}).on('timeout', () => {
				req.destroy(); // this will send  ECONNRESET to the error handler
			});

			log.trace('sending message', message);
			req.write(JSON.stringify(this.#cryptor.encrypt(message)));
			req.end();
		});
	}
}
