import fs from 'fs';
import https from 'https';
import { IncomingMessage, ServerResponse } from 'http';
import tls from 'tls';

import debug from './debug.js';
import { JsonObj, NotificationMessage, TypeValidator } from './types.js';

// typescript complains about 'client' not existing
// apparently it's not in the latest @types, either
interface TLSIncomingMessage extends IncomingMessage {
    client: tls.TLSSocket;
}

interface MessageReceiverOptions {
    pemCertificate?: Buffer;
    pemKey?: Buffer;
    port: number;
}

export type MessageCallback = (msg: NotificationMessage) => void;

class JsonError extends Error {
    constructor(...params: any[]) {
        super(...params);
        this.name = 'JSONError';
    }
}

export class MessageReceiver {
    pemCertificate?: Buffer;
    pemKey?: Buffer;
    #callback?: MessageCallback;
    #port: number;
    #server?: https.Server;

    constructor(options: MessageReceiverOptions) {
        this.pemKey = options.pemKey;
        this.pemCertificate = options.pemCertificate;
        this.#port = options.port;
    }

    public listen(port?: number) {
        port = port ?? this.#port;

        if (!(this.pemKey instanceof Buffer))
            throw new TypeError(`pemKey is not a Buffer`);
        if (!(this.pemCertificate instanceof Buffer))
            throw new TypeError(`pemCertificate is not a Buffer`);

        const options: {[k:string]: any} = {
            key: this.pemKey,
            cert: this.pemCertificate,
            ca: this.pemCertificate,
            requestCert: true,
            rejectUnauthorized: false,
        };

        this.#server = https.createServer(options, async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
            const tlsRequest = request as TLSIncomingMessage;
            debug.trace(`[${tlsRequest.method}] request from ${request.socket.remoteAddress} for ${request.url} auth: ${tlsRequest.client.authorized}`, request.headers);

            if (!tlsRequest.client.authorized) {
                response.writeHead(401);
                response.end();
                return;
            }

            if (tlsRequest.method !== 'POST') {
                response.writeHead(405);
                response.end();
                return;
            }

            let message: NotificationMessage | undefined;
            try {
                debug.trace('reading message');
                message = await (new Promise((resolve, reject): void => {
                    const chunks: Buffer[] = [];
                    tlsRequest.on('data', (data: Buffer): void => {
                        chunks.push(data);
                    }).on('end', () => {
                        try {
                            const jsonobj: JsonObj = JSON.parse(Buffer.concat(chunks).toString());
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

    public loadPemCertFile(filename: string): Buffer {
        this.pemCertificate = fs.readFileSync(filename);
        return this.pemCertificate;
    }

    public loadPemKeyFile(filename: string): Buffer {
        this.pemKey = fs.readFileSync(filename);
        return this.pemKey;
    }

    set callback(func: MessageCallback) {
        this.#callback = func;
    }

    get port(): number {
        return this.#port;
    }
    set port(num: number) {
        if (num < 0 || num > 0xffff)
            throw new RangeError(`port number (${num}) is out of range 0 < num < 65536`);
        if (!Number.isInteger(num))
            throw new TypeError(`port number (${num}) is not an integer`);
    }
}
