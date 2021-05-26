import date from 'date-and-time';
import chalk from 'chalk';
import { ChalkFunction } from 'chalk';

export enum DebugLevel {
	trace = 'TRACE',
	info = 'INFO',
	warn = 'WARN',
	error = 'ERROR'
};
type DebugLevelKey = keyof typeof DebugLevel;
const DebugLevelColors: Record<DebugLevel, ChalkFunction> = {
	[DebugLevel.trace]: chalk.white,
	[DebugLevel.info]: chalk.cyan,
	[DebugLevel.warn]: chalk.ansi256(208),
	[DebugLevel.error]: chalk.redBright,
}

namespace Printers {
	export function log(...args: any[]): void {
		const now = new Date();
		console.log(`[${date.format(now, 'HH:mm:ss.S')}]`, ...args);
	}

	export function nop(...args: any[]): void {}
}
type PrintFunc = typeof Printers.log;

function setLevel(levels: DebugLevel[]): void {
	let k: DebugLevelKey;
	for (k in DebugLevel) {
		const level: DebugLevel = DebugLevel[k];
		if (levels.includes(level)) {
			debug[k] = Printers.log.bind(null, `[${DebugLevelColors[level](level)}]`);
		} else {
			debug[k] = Printers.nop;
		}
	}
};

interface Debug {
	trace: PrintFunc;
	info:  PrintFunc;
	warn:  PrintFunc;
	error: PrintFunc;
	LEVEL: typeof DebugLevel;
	setLevel: typeof setLevel;
}

const debug: Debug = {
	trace: Printers.nop,
	info: Printers.nop,
	warn: Printers.nop,
	error: Printers.nop,
	LEVEL: DebugLevel,
	setLevel
};
setLevel([DebugLevel.trace, DebugLevel.info , DebugLevel.warn , DebugLevel.error]);

export default debug;
