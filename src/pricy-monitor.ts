import debug from './debug.js';
import { notify } from './notifier.js';
import http from 'http';
import https from 'https';

process.on('unhandledRejection', console.log);

const NODE_ENV : string | undefined = process.env.NODE_ENV;

debug.info('starting up');

// https://www.amazon.ca/Sony-SEL1224G-12-24mm-Fixed-Camera/dp/B072J4B6WS/
//let res: http.ClientRequest = await https.get('https://google.ca');
//debug.trace(res);
debug.info('ending');
