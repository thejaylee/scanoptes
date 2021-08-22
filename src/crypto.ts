import crypto from 'crypto';

const PBKDF_SALT = Buffer.from('718d9835b60005b11a0ded696266a05c', 'hex');
const PBKDF_ITERATIONS = 100000;

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

	public static deriveKey(password: string): Buffer {
		return crypto.pbkdf2Sync(password, PBKDF_SALT, PBKDF_ITERATIONS, 32, 'sha256');
	}

	public static generateKey(): Buffer {
		return crypto.randomBytes(32);
	}

	readonly #key: Buffer;

	constructor(key: Buffer) {
		this.#key = key;
	}

	public encrypt(data: Buffer): [Buffer, Buffer] {
		// aes 256 uses 16 byte (128 bit) IVs
		// https://stackoverflow.com/questions/31132162/what-size-of-initialization-vector-needed-for-aes-256-encryption-in-java
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
		return JSON.parse(
			this.#cipher.decrypt(
				Buffer.from(msg.enc, 'base64'),
				Buffer.from(msg.iv, 'base64')
			).toString()
		);
	}
}
