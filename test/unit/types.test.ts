import { TypeValidator } from '../../src/types';

describe('TypeValidator', () => {
	describe('conformsTo', () => {
		test('works for simple objects', () => {
			const obj = {
				foo: 'bar',
				asdf: 123,
				qwerty: true,
				nested: {
					something: 'else',
				},
			};
			const def = {
				foo: 'string',
				asdf: 'number',
				qwerty: 'boolean',
				nested: 'object',
			};

			expect(TypeValidator.conformsTo(obj, def)).toStrictEqual(true);
		});

		test('returns false when object key:value has missing definition', () => {
			const obj = {
				foo: 'bar',
				asdf: 123,
				qwerty: true,
				nested: {
					something: 'else',
				},
			};
			const def = {
				asdf: 'number',
				qwerty: 'boolean',
				nested: 'object',
			};

			expect(TypeValidator.conformsTo(obj, def)).toStrictEqual(false);
		});
	});
});
