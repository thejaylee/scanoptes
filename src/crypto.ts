import crypto from 'crypto';
import debug from './debug.js';


export interface Base64EncryptedMessage {
	iv: string;
	enc: string;
	tag?: string;
}

export interface BlockCipher {
	encrypt: (data: Buffer) => [Buffer, Buffer];
	decrypt: (data: Buffer, iv: Buffer) => Buffer;
}

export interface ObjectCipher {
	encrypt: (obj: object) => Base64EncryptedMessage;
	decrypt: (msg: Base64EncryptedMessage) => object;
}

export class Aes256Cbc implements BlockCipher {
	protected static readonly ALG = 'aes-256-cbc';
	readonly #key: Buffer;

	constructor(key: Buffer) {
		this.#key = key;
	}

	public encrypt(data: Buffer): [Buffer, Buffer] {
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv(Aes256Cbc.ALG, this.#key, iv);

		const enc = Buffer.concat([cipher.update(data), cipher.final()]);
		return [enc, iv];
	}

	public decrypt(data: Buffer, iv: Buffer): Buffer {
		const cipher = crypto.createDecipheriv(Aes256Cbc.ALG, this.#key, iv);
		return Buffer.concat([cipher.update(data), cipher.final()]);
	}
}

export class Cryptor implements ObjectCipher {
	readonly #cipher: BlockCipher;

	constructor(cipher: BlockCipher) {
		this.#cipher = cipher;
	}

	public encrypt(obj: object): Base64EncryptedMessage {
		const [enc, iv] =  this.#cipher.encrypt(Buffer.from(JSON.stringify(obj)));
		return {
			iv: iv.toString('base64'),
			enc: enc.toString('base64')
		};
	}

	public decrypt(msg: Base64EncryptedMessage): Buffer {
		debug.trace('iv', Buffer.from(msg.iv, 'base64'));
		return JSON.parse(
			this.#cipher.decrypt(
				Buffer.from(msg.enc, 'base64'),
				Buffer.from(msg.iv, 'base64')
			).toString()
		);
	}
}

//const data = Buffer.from('hello, world. this is a test');
//const key = crypto.randomBytes(32);
//const crypt = new ObjectCryptor(new Aes256Cbc(key));
//const enc = crypt.encrypt({title:'hello world, this is a test'});
//const dec = crypt.decrypt(enc);
//debug.trace(enc);
//debug.trace(dec);

//const [enc, iv] = aes256cbc(key).encrypt(data);
//debug.trace('iv', iv);
//debug.trace('encrypted', enc);
//debug.trace('length', data.length, enc.length);
//const dec = aes256cbc(key).decrypt(enc, iv);
//debug.trace('decrypted', dec);
//debug.trace('string', dec.toString());
//
//debug.trace('nonsense', aes256cbc(crypto.randomBytes(32)).decrypt(enc, iv));
