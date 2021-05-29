import fs from 'fs';
import https from 'https';
import http from 'http';
import tls from 'tls';

import debug, { DebugLevel } from './debug.js';
import { MessageReceiver } from './messenger.js';
import { Notifier } from './notifier.js';
import { NotificationMessage } from './types.js';

process.on('unhandledRejection', console.log);

const NODE_ENV : string | undefined = process.env.NODE_ENV;

const DEFAULT_KEY_FILE: string = 'server_key.pem';
const DEFAULT_CERT_FILE: string = 'server_cert.pem';
const DEFAULT_PORT: number = 8000;

const serverKeyFile: string = process.env.npm_package_config_server_key_file ?? DEFAULT_KEY_FILE;
const serverCertFile: string = process.env.npm_package_config_server_cert_file ?? DEFAULT_CERT_FILE;
const serverPort: number = Number(process.env.npm_package_config_comms_port) ?? DEFAULT_PORT;

let debug_levels: DebugLevel[] = [debug.LEVEL.info, debug.LEVEL.warn, debug.LEVEL.error];
switch (NODE_ENV) {
	case 'debug':
		debug_levels = debug_levels.concat([debug.LEVEL.trace]);
		break;
}
debug.setLevel(debug_levels);

interface TLSIncomingMessage extends http.IncomingMessage {
	client: tls.TLSSocket;
}

debug.info('starting pricy notifier');
const notifier = new Notifier();
const receiver: MessageReceiver = new MessageReceiver({
	pemKey: fs.readFileSync(serverKeyFile),
	pemCertificate: fs.readFileSync(serverCertFile),
	port: serverPort
});
receiver.callback = (message: NotificationMessage): void => {
	notifier.alertOnDesktop(message);
}
receiver.listen();
