import fs from 'fs';
import http from 'http';

import debug, { DebugLevel } from './debug.js';
import { WatchDefinition } from './types.js';
import { Watcher } from './watcher.js';
import { Notifier } from './notifier.js';
import { load_json_file_sync } from './util.js';

process.on('unhandledRejection', console.log);

const DEFAULT_WATCH_FILE = 'watches.json'
const DEFAULT_CLIENT_CERT_FILE = 'client_cert.pem'
const DEFAULT_CA_CERT_FILE = 'server_cert.pem'
const NODE_ENV : string | undefined = process.env.NODE_ENV;

let debug_levels: DebugLevel[] = [debug.LEVEL.info, debug.LEVEL.warn, debug.LEVEL.error];
switch (NODE_ENV) {
	case 'debug':
		debug_levels = debug_levels.concat([debug.LEVEL.trace]);
		break;
}
debug.setLevel(debug_levels);

debug.trace(process.env.npm_package_config_watches_file);
debug.trace(process.env.npm_package_config_scan_interval);
const watchFile: string = process.argv[2] ?? DEFAULT_WATCH_FILE;
const defs: WatchDefinition[] = load_json_file_sync(watchFile);
let watchers: Watcher[] = defs.map((def: WatchDefinition): Watcher => {
	return Watcher.fromDefinition(def);
});
debug.trace(watchers);

debug.info('starting up');
process_watches(watchers);
const notifier = new Notifier();
debug.info('ending');

async function process_watches(watchers: Watcher[]): Promise<void> {
	for (const w of watchers) {
		w.start();
		w.sentinel?.then(onWatchAlert);
	}
}

function onWatchAlert(watcher: Watcher): void {
	debug.info(`${watcher.name} passed!`);
	notifier.postToUrl(
		{
			title: watcher.name,
			body: watcher.description ?? `${watcher.name} has passed!`,
			url: watcher.url
		},
		'http://172.22.2.8:8000/'
	);

	watcher.sentinel?.then(onWatchAlert);
}
