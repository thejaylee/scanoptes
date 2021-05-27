import fs from 'fs';
import https from 'https';
import http from 'http';
import tls from 'tls';

import debug, { DebugLevel } from './debug.js';
import { MessageReceiver } from './messenger.js';

process.on('unhandledRejection', console.log);

const NODE_ENV : string | undefined = process.env.NODE_ENV;

const DEFAULT_KEY_FILE: string = 'server_key.pem';
const DEFAULT_CERT_FILE: string = 'server_cert.pem';
const DEFAULT_PORT: number = 8000;

const serverKeyFile: string = process.env.npm_package_config_server_key_file ?? DEFAULT_KEY_FILE;
const serverCertFile: string = process.env.npm_package_config_server_cert_file ?? DEFAULT_CERT_FILE;
const serverPort: number = Number(process.env.npm_package_config_comms_port) ?? DEFAULT_PORT;

let debug_levels: DebugLevel[] = [debug.LEVEL.info, debug.LEVEL.warn, debug.LEVEL.error];
switch (NODE_ENV) {
	case 'debug':
		debug_levels = debug_levels.concat([debug.LEVEL.trace]);
		break;
}
debug.setLevel(debug_levels);

interface TLSIncomingMessage extends http.IncomingMessage {
	client: tls.TLSSocket;
}

debug.info('starting pricy notifier');
const receiver: MessageReceiver = new MessageReceiver({
	pemKey: fs.readFileSync(serverKeyFile),
	pemCertificate: fs.readFileSync(serverCertFile),
	port: serverPort
});
receiver.listen();


//const options: {[k:string]: any} = {
//	key: fs.readFileSync(serverKeyFile),
//	cert: fs.readFileSync(serverCerFile),
//	ca: fs.readFileSync(serverCerFile),
//	requestCert: true,
//	rejectUnauthorized: false,
//};
//
//https.createServer(options, (req: http.IncomingMessage, res: http.ServerResponse): void => {
//	const tlsreq = req as TLSIncomingMessage;
//	debug.trace(`${tlsreq.client.authorized} request from ${req.socket.remoteAddress} for ${req.url}`, req.headers);
//
//	if (!tlsreq.client.authorized) {
//		res.writeHead(401);
//		res.end();
//	} else {
//		const data: Buffer = Buffer.from('{"foo":"bar"}\n');
//		res.writeHead(200, {
//			'Content-Type': 'application/json',
//			'Content-Length': data.length
//		});
//		res.end(data);
//	}
//}).listen(serverPort);
