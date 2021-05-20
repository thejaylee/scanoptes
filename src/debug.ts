const NODE_ENV : string | undefined = process.env.NODE_ENV;

type DebugFunc = (...args: any[]) => void;

export let debug: DebugFunc;

if (NODE_ENV == 'debug') {
	debug = console.log;
} else {
	debug = () => {}
}
