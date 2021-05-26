import http from 'http';

import debug, { DebugLevel } from './debug.js';
import { notify } from './notifier.js';
import { WatchDefinition } from './types.js';
import { Watcher } from './watcher.js';
import { loadJsonFileSync } from './util.js';

process.on('unhandledRejection', console.log);

const DEFAULT_WATCH_FILE = 'watches.json'
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
const defs: WatchDefinition[] = loadJsonFileSync(watchFile);
let watchers: Watcher[] = defs.map((def: WatchDefinition): Watcher => {
	return Watcher.fromDefinition(def);
});
debug.trace(watchers);

debug.info('starting up');
process_watches(watchers);
debug.info('ending');

async function process_watches(watchers: Watcher[]): Promise<void> {
	for (const w of watchers) {
		w.start();
		w.sentinel?.then(onWatchPass);
	}
}

function onWatchPass(watcher: Watcher): void {
	debug.info(`${watcher.name} passed!`);
	watcher.sentinel?.then(onWatchPass);
}
