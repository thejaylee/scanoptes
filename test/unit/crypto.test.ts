import { Aes256Cbc, BlockCipher, Cryptor } from '../../src/crypto';

class NullCipher implements BlockCipher {
	public encrypt(data: Buffer): [Buffer, Buffer] {
		return [data, Buffer.alloc(16, 0x88)];
	}

	public decrypt(data: Buffer, _iv: Buffer): Buffer {
		return data;
	}
}

describe('Cryto', () => {
	describe('Aes256Cbc', () => {
		test('encrypts and decrypts', () => {
			const plain = Buffer.from('i am just some test data');
			const key = Aes256Cbc.generateKey();

			const cipher = new Aes256Cbc(key);
			const [enc, iv] = cipher.encrypt(plain);
			const dec = cipher.decrypt(enc, iv);

			expect(dec).toStrictEqual(plain);
		});

		test('key derivation is a pure function', () => {
			const key1 = Aes256Cbc.deriveKey('test password');
			const key2 = Aes256Cbc.deriveKey('test password');

			expect(key1).toStrictEqual(key2);
		});
	});

	describe('Cryptor', () => {
		const plain = {
			foo: 'bar',
			asdf: 'qwerty',
			nested: {
				stuff: 'here'
			}
		};
		Object.freeze(plain);

		test('encrypted message is base64', () => {
			const cryptor = new Cryptor(new NullCipher());
			const msg = cryptor.encrypt(plain);
			
			expect(msg).toMatchObject({
				iv: expect.anything(),
				enc: expect.anything(),
			});
			const decoded = JSON.parse(Buffer.from(msg.enc, 'base64').toString());
			expect(decoded).toEqual(plain);
		});

		test('base64 message decrypts to object', () => {
			const cryptor = new Cryptor(new NullCipher());
			const msg = {
				iv: Buffer.alloc(16, 0x88).toString('base64'),
				enc: Buffer.from(JSON.stringify(plain)).toString('base64'),
			}
			
			const decoded = cryptor.decrypt(msg);
			expect(decoded).toEqual(plain);
		});
	});
});
