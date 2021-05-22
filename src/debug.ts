export enum DebugLevel {
	trace = 'TRACE',
	info = 'INFO',
	warn = 'WARN',
	error = 'ERROR'
};
type DebugLevelKey = keyof typeof DebugLevel;

namespace Printers {
	export function log(...args: any[]): void {
		console.log(...args);
	}

	export function nop(...args: any[]): void {}
}
type PrintFunc = typeof Printers.log;

function setLevel(levels: DebugLevel[]): void {
	let l: DebugLevelKey;
	for (l in DebugLevel) {
		if (levels.includes(DebugLevel[l])) {
			debug[l] = Printers.log.bind(null, `[${DebugLevel[l]}]`);
		} else {
			debug[l] = Printers.nop;
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
