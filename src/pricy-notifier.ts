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

let debug_levels: DebugLevel[] = [debug.LEVEL.info, debug.LEVEL.warn, debug.LEVEL.error];
switch (NODE_ENV) {
	case 'debug':
		debug_levels = debug_levels.concat([debug.LEVEL.trace]);
		break;
}
debug.setLevel(debug_levels);

debug.info('starting pricy notifier');
const notifier = new Notifier();
const receiver: MessageReceiver = new MessageReceiver();
receiver.callback = (message: NotificationMessage): void => {
	notifier.alertOnDesktop(message);
}
receiver.listen(Number(process.env.npm_package_config_comms_port) ?? 8000);
