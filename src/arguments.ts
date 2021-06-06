import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const DEFAULT_PORT: number = 8888;
const DEFAULT_WATCHES_FILE = 'watches.json';
const DEFAULT_KEY_FILE = 'encryption.key';

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
	genkey: {
		command: {
			default: 'genkey',
			hidden: true,
		},
	},
};

const options: any = {};
options.all = {
	verbose: {
		alias: 'v',
		default: false,
		type: 'boolean',
		describe: "debug level output",
	},
	vv: {
		default: false,
		type: 'boolean',
		describe: "trace level output"
	}
};
options.active = {
	watches: {
		alias: 'f',
		default: DEFAULT_WATCHES_FILE,
		type: 'string',
		describe: 'JSON watch definition file',
	},
	nostart: {
		default: false,
		type: 'boolean',
		describe: 'supress the startup notification'
	},
}
options.port = {
	port: {
		alias: 'p',
		type: 'number',
		default: DEFAULT_PORT,
		describe: 'port to listen on',
		group: 'Notifier:',
	}
};
options.key = {
	key: {
		alias: 'k',
		requiresArg: true,
		type: 'string',
		default: DEFAULT_KEY_FILE,
		describe: 'encryption key filename',
		group: 'Watcher:',
	},
};

options.desktop = { ...options.active, ...options.port };
options.notifier = { ...options.active, ...options.port, ...options.key };
options.watcher = { ...options.active, ...options.port, ...options.key,
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
	vv: boolean;
	nostart: boolean;
	host: string;
	h: string;
	port: number;
	p: number;
	key: string;
	k: string;
}

export const argv: Arguments = yargs(hideBin(process.argv))
	.config()
	.options(options.all)
	.command(['desktop', '$0'], 'run in standalone desktop mode', { ...command.desktop, ...options.desktop })
	.command('notifier', 'run in desktop notification mode', { ...command.notifier, ...options.notifier })
	.command('watcher', 'run watcher mode', { ...command.watcher, ...options.watcher })
	.command('genkey', 'generate an encryption key', { ...command.genkey, ...options.key })
	.demandCommand(1)
	.parse() as Arguments;
