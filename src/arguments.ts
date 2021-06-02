import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const DEFAULT_PORT: number = 8888;
const DEFAULT_WATCHES_FILE = 'watches.json';

const command: any = {
	desktop: {
		command: {
			default: 'desktop',
			hidden: true,
		},
	},
	notifier: {
		command: {
			default: 'notifier',
			hidden: true,
		},
	},
	watcher: {
		command: {
			default: 'watcher',
			hidden: true,
		},
	},
};

const options: any = {};
options.all = {
	watches: {
		alias: 'f',
		default: DEFAULT_WATCHES_FILE,
		type: 'string',
		describe: 'JSON watch definition file',
	},
	verbose: {
		alias: 'v',
		default: false,
		type: 'boolean',
		describe: "verbose level output",
	}
};
options.password = {
	password: {
		alias: 'k',
		demandOption: true,
		requiresArg: true,
		type: 'string',
		describe: 'password to be used for PBKDF encryption key',
		group: 'Watcher/Notifier:',
	},
};
options.port = {
	port: {
		alias: 'p',
		type: 'number',
		default: DEFAULT_PORT,
		describe: 'port to listen on',
		group: 'Notifier:',
	}
};
options.notifier = {
	...command.notifier, ...options.password, ...options.port
};
options.watcher = {
	...command.watcher, ...options.password, ...options.port,
	host: {
		alias: 'h',
		demandOption: true,
		requiresArg: true,
		type: 'string',
		describe: 'Hostname to post notifications to',
		group: 'Watcher:',
	}
}

// some of these may not be set depending on the command passed to yargs
// codepaths should check the command before using possible undefined values
export interface Arguments {
	[x: string]: unknown;
	_: (string | number)[];
	$0: string;
	command: string;
	watches: string;
	f: string;
	verbose: boolean;
	v: boolean;
	host: string;
	h: string;
	password: string;
	k: string;
	port: number;
	p: number;
}

export const argv: Arguments = yargs(hideBin(process.argv))
	.config()
	.options(options.all)
	.command(['desktop', '$0'], 'run in standalone desktop mode', command.desktop)
	.command('notifier', 'run in desktop notification mode', options.notifier)
	.command('watcher', 'run watcher mode', options.watcher)
	.demandCommand(1)
	.parse() as Arguments;
