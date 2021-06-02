import fs from 'fs';
import http from 'http';

import { argv } from './arguments.js';
import { Aes256Cbc, Cryptor } from './crypto.js';
import debug, { DebugLevel } from './debug.js';
import { MessageReceiver } from './messenger.js';
import { Notifier, DesktopNotifier, HttpPostNotifier } from './notifier.js';
import { NotificationMessage, WatchDefinition } from './types.js';
import { load_json_file_sync } from './util.js';
import { Watcher } from './watcher.js';

process.on('unhandledRejection', console.log);

let debug_levels: DebugLevel[] = [debug.LEVEL.info, debug.LEVEL.warn, debug.LEVEL.error];
if (argv.verbose)
	debug_levels.push(debug.LEVEL.trace);
debug.setLevel(debug_levels);

debug.trace('CLI arguments', argv);

let notifier: Notifier;
let cryptor: Cryptor;

switch (argv.command) {
	case 'desktop':
		notifier = new DesktopNotifier();
		start_watching();
		break;

	case 'watcher':
		cryptor = new Cryptor(new Aes256Cbc(Aes256Cbc.deriveKey(argv.password)));
		notifier = new HttpPostNotifier(`http://${argv.host}:${argv.port}`, cryptor);
		start_watching();
		break;

	case 'notifier':
		cryptor = new Cryptor(new Aes256Cbc(Aes256Cbc.deriveKey(argv.password)));
		notifier = new DesktopNotifier();
		const receiver: MessageReceiver = new MessageReceiver(cryptor);
		receiver.callback = (message: NotificationMessage): void => {
			notifier.notify(message);
		}
		receiver.listen(argv.port);
		break;

	default:
		console.log("You started without a command. This shouldn't happen. I don't know how you did this");
		process.exit(-1);
}

function start_watching(): void {
	const defs: WatchDefinition[] = load_json_file_sync(argv.watches);
	let watchers: Watcher[] = defs.map((def: WatchDefinition): Watcher => {
		return Watcher.fromDefinition(def);
	});
	debug.trace(watchers);

	for (const w of watchers) {
		w.start();
		w.sentinel?.then(onWatchSuccess);
	}
}


function onWatchSuccess(watcher: Watcher): void {
	debug.info(`${watcher.name} passed!`);
	notifier.notify({
		title: watcher.name,
		body: watcher.description ?? `${watcher.name} has passed!`,
		url: watcher.url
	});

	watcher.sentinel?.then(onWatchSuccess);
}
