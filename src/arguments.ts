import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const DEFAULT_PORT: number = 8888;
const DEFAULT_WATCHES_FILE = 'watches.json';

const options: any = {
	all: {
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
	},
	client_server: {
		password: {
			alias: 'k',
			demandOption: true,
			requiresArg: true,
			type: 'string',
			describe: 'password to be used for PBKDF encryption key',
			group: 'Client/Server:',
		},
		port: {
			alias: 'p',
			type: 'number',
			default: DEFAULT_PORT,
			describe: 'port to be used for client/server mode',
			group: 'Client/Server:',
		}
	},
};

const command: any = {
	desktop: {
		command: {
			default: 'desktop',
			hidden: true,
		},
	},
	client: {
		command: {
			default: 'client',
			hidden: true,
		},
	},
	server: {
		command: {
			default: 'server',
			hidden: true,
		},
	},
};

export const argv = yargs(hideBin(process.argv))
	.config()
	.options(options.all)
	.command(['desktop', '$0'], 'run in standalone desktop mode', command.desktop)
	.command('client', 'run in client desktop mode', { ...options.client_server, ...command.client })
	.command('server', 'run server mode', { ...options.client_server, ...command.server })
	.demandCommand(1)
	.parse();
