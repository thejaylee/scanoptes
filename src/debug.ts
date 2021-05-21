type PrintFunc = (...args: any[]) => void;
type LevelFunc = (levels: DebugLevel[]) => void;

enum DebugLevel {
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

interface Debug {
	trace: PrintFunc;
	info:  PrintFunc;
	warn:  PrintFunc;
	error: PrintFunc;
	LEVEL: typeof DebugLevel;
	setLevel: LevelFunc;
}

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
