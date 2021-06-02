import fs from 'fs';
import http, { IncomingMessage, ServerResponse } from 'http';

import debug from './debug.js';
import { Base64EncryptedMessage, Cryptor } from './crypto.js';
import { JsonObj, NotificationMessage, TypeValidator } from './types.js';

export type MessageCallback = (msg: NotificationMessage) => void;

class JsonError extends Error {
	constructor(...params: any[]) {
		super(...params);
		this.name = 'JSONError';
	}
}

export class MessageReceiver {
	#callback?: MessageCallback;
	#server?: http.Server;
	#cryptor: Cryptor;

	constructor(cryptor: Cryptor) {
		this.#cryptor = cryptor;
	}

	public listen(port: number) {
		this.#server = http.createServer(async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
			debug.trace(`[${request.method}] request from ${request.socket.remoteAddress} for ${request.url}`, request.headers);

			if (request.method !== 'POST') {
				response.writeHead(405);
				response.end();
				return;
			}

			let message: NotificationMessage | undefined;
			try {
				debug.trace('reading message');
				message = await (new Promise((resolve, reject): void => {
					const chunks: Buffer[] = [];
					request.on('data', (data: Buffer): void => {
						chunks.push(data);
					}).on('end', () => {
						try {
							const enc: Base64EncryptedMessage = JSON.parse(Buffer.concat(chunks).toString());
							const jsonobj: JsonObj = this.#cryptor.decrypt(enc);
							if (!TypeValidator.conformsToNotificationMessage(jsonobj))
								throw new Error();
							resolve(jsonobj as NotificationMessage);
						} catch (error) {
							reject(new JsonError());
						}
					});
				}));
				debug.trace('received message:', message);
			} catch (error) {
				if (error instanceof JsonError) {
					response.writeHead(400);
					response.end('Bad JSON data');
					return;
				}
			}
			debug.trace('processing message');
			if (message)
				this.#callback?.(message);

			response.writeHead(201);
			response.end();

		}).listen(port);
	}

	public close(): void {
		if (this.#server?.listening)
			this.#server?.close();
	}

	set callback(func: MessageCallback) {
		this.#callback = func;
	}
}
