import path from 'path';
import https from 'https';

import notifier from 'node-notifier';

import { open_url } from './util.js';
import { NotificationMessage } from './types.js';

const DEFAULT_ICON_FILE = path.join(process.cwd(), 'notification_icon.png');
const icon: string = process.env.npm_package_config_icon_file ?? DEFAULT_ICON_FILE;

export class Notifier {
    #pemCertificate?: Buffer;

    constructor() {
    }

    public alertOnDesktop(message: NotificationMessage): void {
        notifier.notify({
            title: message.title,
            message: message.body,
            icon
        },
        (err, response, metadata) => {
            if (err || response != 'activate')
                return;

            if (message.url)
                open_url(message.url);
        });
    }

    public setCertificate(cert: Buffer): void {
        this.#pemCertificate = cert;
    }

    public sendToUrl(message: NotificationMessage, url: string): void {
        if (!this.#pemCertificate)
            throw new Error('no certificate set for Notifier.sendToUrl');

        https.request(url, {
            cert: this.#pemCertificate
        });
    }
}
