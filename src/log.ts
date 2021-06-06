import date from 'date-and-time';
import chalk from 'chalk';
import { ChalkFunction } from 'chalk';

export enum LogLevel {
	trace = 'TRACE',
	debug = 'DEBUG',
	info = 'INFO',
	warn = 'WARN',
	error = 'ERROR'
};
type LogLevelKey = keyof typeof LogLevel;
const LogLevelColors: Record<LogLevel, ChalkFunction> = {
	[LogLevel.trace]: chalk.white,
	[LogLevel.debug]: chalk.cyanBright,
	[LogLevel.info]: chalk.greenBright,
	[LogLevel.warn]: chalk.ansi256(208),
	[LogLevel.error]: chalk.redBright,
}

namespace Printers {
	export function log(...args: any[]): void {
		const now = new Date();
		console.log(`[${date.format(now, 'HH:mm:ss.S')}]`, ...args);
	}

	export function nop(...args: any[]): void {}
}
type PrintFunc = typeof Printers.log;

function setLevel(levels: LogLevel[]): void {
	let k: LogLevelKey;
	for (k in LogLevel) {
		const level: LogLevel = LogLevel[k];
		if (levels.includes(level)) {
			log[k] = Printers.log.bind(null, `[${LogLevelColors[level](level)}]`);
		} else {
			log[k] = Printers.nop;
		}
	}
};

interface Log {
	trace: PrintFunc;
	debug: PrintFunc;
	info:  PrintFunc;
	warn:  PrintFunc;
	error: PrintFunc;
	LEVEL: typeof LogLevel;
	setLevel: typeof setLevel;
}

const log: Log = {
	trace: Printers.nop,
	debug: Printers.nop,
	info: Printers.nop,
	warn: Printers.nop,
	error: Printers.nop,
	LEVEL: LogLevel,
	setLevel
};
setLevel([LogLevel.info , LogLevel.warn , LogLevel.error]);

export default log;
