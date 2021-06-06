import fs from 'fs';
import http from 'http';

import { argv } from './arguments.js';
import { Aes256Cbc, Cryptor } from './crypto.js';
import log, { LogLevel } from './log.js';
import { MessageReceiver } from './messenger.js';
import { Notifier, DesktopNotifier, HttpPostNotifier } from './notifier.js';
import { NotificationMessage, WatchDefinition } from './types.js';
import { load_json_file_sync } from './util.js';
import { Watcher } from './watcher.js';

process.on('unhandledRejection', console.log);

let log_levels: LogLevel[] = [log.LEVEL.info, log.LEVEL.warn, log.LEVEL.error];
if (argv.v || argv.vv)
	log_levels.push(log.LEVEL.debug);
if (argv.vv)
	log_levels.push(log.LEVEL.trace);
log.setLevel(log_levels);

log.trace('CLI arguments', argv);

const start_notice: NotificationMessage = {
	title: "Scanoptes Watching",
	body: "Scanoptes watcher has started up"
}

let notifier: Notifier;
let cryptor: Cryptor;

switch (argv.command) {
	case 'desktop':
		notifier = new DesktopNotifier();
		start_watching();
		if (!argv.nostart)
			notifier.notify(start_notice);
		break;

	case 'watcher':
		cryptor = new Cryptor(new Aes256Cbc(fs.readFileSync(argv.key)));
		notifier = new HttpPostNotifier(`http://${argv.host}:${argv.port}`, cryptor);
		start_watching();
		if (!argv.nostart)
			notifier.notify(start_notice);
		break;

	case 'notifier':
		cryptor = new Cryptor(new Aes256Cbc(fs.readFileSync(argv.key)));
		notifier = new DesktopNotifier();
		const receiver: MessageReceiver = new MessageReceiver(cryptor);
		receiver.callback = (message: NotificationMessage): void => {
			notifier.notify(message);
		}
		receiver.listen(argv.port);
		break;

	case 'genkey':
		await fs.writeFileSync(argv.key, Aes256Cbc.generateKey(), { mode: 0o600 });
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
	log.trace(watchers);

	for (const w of watchers) {
		w.start();
		w.sentinel?.then(onWatchSuccess);
	}
}

function onWatchSuccess(watcher: Watcher): void {
	log.info(`${watcher.name} passed!`);
	notifier.notify({
		title: watcher.name,
		body: watcher.description ?? `${watcher.name} has passed!`,
		url: watcher.url
	});

	watcher.sentinel?.then(onWatchSuccess);
}
