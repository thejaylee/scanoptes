import debug from './debug';
import { notify } from './notifier';

process.on('unhandledRejection', console.log);

const NODE_ENV : string | undefined = process.env.NODE_ENV;

debug.info('starting up');
