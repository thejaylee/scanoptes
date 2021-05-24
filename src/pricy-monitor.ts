import http from 'http';

import debug, { DebugLevel } from './debug.js';
import { notify } from './notifier.js';
import { PromiseFunc } from './types.js';
import { Watcher, WatchDefinition } from './watcher.js';
import { WebDocument } from './web-document.js';
import { loadJsonFileSync } from './util.js';

process.on('unhandledRejection', console.log);

const DEFAULT_WATCH_FILE = 'watches.json'
const NODE_ENV : string | undefined = process.env.NODE_ENV;

let debug_levels: DebugLevel[] = [debug.LEVEL.warn, debug.LEVEL.error];
switch (NODE_ENV) {
	case 'debug':
		debug_levels = debug_levels.concat([debug.LEVEL.info, debug.LEVEL.trace]);
		break;
}
debug.setLevel(debug_levels);


debug.trace(process.env.npm_package_config_watches_file);
debug.trace(process.env.npm_package_config_scan_interval);
const watchFile: string = process.argv[2] ?? DEFAULT_WATCH_FILE;
const watchDefs: WatchDefinition[] = loadJsonFileSync(watchFile);
let watches: Watcher[] = watchDefs.map((wd: WatchDefinition): Watcher => {
	return Watcher.fromDefinition(wd);
});
debug.trace(watches);

debug.info('starting up');
process_watches(watches);
debug.info('ending');

async function process_watches(watches: Watcher[]): Promise<void> {
	for (const watch of watches) {
		//const found: boolean = await watch.check();
		//debug.trace(`${watch.name}: ${found}`);
		watch.start(10);
	}
}
