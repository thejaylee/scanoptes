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
const LogLevelColors: Record<LogLevel, ChalkFunction> = {
	[LogLevel.trace]: chalk.white,
	[LogLevel.debug]: chalk.cyan,
	[LogLevel.info]: chalk.green,
	[LogLevel.warn]: chalk.ansi256(208),
	[LogLevel.error]: chalk.redBright,
}

type LogFunc = (...args: any[]) => void;
type LogOutputFunc = (out: string, ...args: any[]) => void;

export class Logger {
	static default: Logger;

	#levels: LogLevel[];
	outputter: LogOutputFunc;

	constructor(outputter: LogOutputFunc, levels?: LogLevel[]) {
		this.outputter = outputter;
		this.#levels = [];
		this.levels = levels || [];
	}

	set levels(levels: LogLevel[]) {
		this.#levels = levels;
		let k: keyof typeof LogLevel;
		for (k in LogLevel) {
			const level: LogLevel = LogLevel[k];
			if (levels.includes(level)) {
				this[k] = this._log.bind(this, `[${LogLevelColors[level](level)}]`);
			} else {
				this[k] = this._nop;
			}
		}
	}

	get levels(): LogLevel[] {
		return this.#levels;
	}

	_log(...args: any[]): void {
		const now = new Date();
		this.outputter(`[${date.format(now, 'HH:mm:ss.S')}]`, ...args);
	}

	_nop(..._: any[]): void {}

	trace: LogFunc = this._nop;
	debug: LogFunc = this._nop;
	info: LogFunc = this._nop;
	warn: LogFunc = this._nop;
	error: LogFunc = this._nop;
}

export const consoleLogger: Logger = new Logger(console.log, [LogLevel.info, LogLevel.warn, LogLevel.error]);
