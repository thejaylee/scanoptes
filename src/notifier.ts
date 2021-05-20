const notifier = require('node-notifier');

export function notify(...args : any) {
	notifier.notify(...args);
}
