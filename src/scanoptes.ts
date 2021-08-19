import fs from 'fs';

import { argv } from './arguments.js';
import { Aes256Cbc, Cryptor } from './crypto.js';
import log, { LogLevel } from './log.js';
import { MessageReceiver } from './messenger.js';
import { RetryNotifier, DesktopNotifier, HttpPostNotifier } from './notifier.js';
import { NotificationMessage, WatchDefinition } from './types.js';
import { load_json_file_sync } from './util.js';
import { Watcher } from './watcher.js';


let log_levels: LogLevel[] = [log.LEVEL.info, log.LEVEL.warn, log.LEVEL.error];
if (argv.v || argv.vv)
	log_levels.push(log.LEVEL.debug);
if (argv.vv)
	log_levels.push(log.LEVEL.trace);
log.setLevel(log_levels);

log.trace();
log.debug();
log.info();
log.warn();
log.error();
log.trace('CLI arguments', argv);
process.on('unhandledRejection', log.error);

const start_notice: NotificationMessage = {
	title: "Scanoptes Watching",
	body: "Scanoptes watcher has started up"
}

let notifier: RetryNotifier;
let cryptor: Cryptor;

switch (argv.command) {
	case 'desktop':
		notifier = new DesktopNotifier();
		setup_retries(notifier);
		start_watching();
		if (!argv.nostart)
			notifier.notifyWithRetry(start_notice);
		break;

	case 'watcher':
		cryptor = new Cryptor(new Aes256Cbc(fs.readFileSync(argv.key)));
		notifier = new HttpPostNotifier(`http://${argv.host}:${argv.port}`, cryptor);
		setup_retries(notifier);
		start_watching();
		if (!argv.nostart)
			notifier.notifyWithRetry(start_notice);
		break;

	case 'notifier':
		cryptor = new Cryptor(new Aes256Cbc(fs.readFileSync(argv.key)));
		notifier = new DesktopNotifier();
		setup_retries(notifier);
		const receiver: MessageReceiver = new MessageReceiver(cryptor);
		receiver.callback = (message: NotificationMessage): void => {
			notifier.notifyWithRetry(message);
		}
		receiver.listen(argv.port);
		break;

	case 'genkey':
		fs.writeFileSync(argv.key, Aes256Cbc.generateKey(), { mode: 0o600 });
		break;

	default:
		console.log("You started without a command. This shouldn't happen. I don't know how you did this");
		process.exit(-1);
}

function setup_retries(notifier: RetryNotifier): void {
	const retries = argv['notification-retries'];
	if (retries[0] > 0 && retries[1] > 0)
		notifier.setRetries(retries[0], retries[1]);
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
	notifier.notifyWithRetry({
		title: watcher.name,
		body: watcher.description ?? `${watcher.name} has passed!`,
		url: watcher.url
	});

	watcher.sentinel?.then(onWatchSuccess);
}
