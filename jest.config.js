// https://github.com/microsoft/TypeScript-Node-Starter/blob/master/README.md#testing
export default {
	globals: {
		'ts-jest': {
			tsconfigFile: 'tsconfig.json'
		}
	},
	moduleFileExtensions: ['ts', 'js'],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	},
	testMatch: [
		'**/test/**/*.test.(ts|js)'
	],
	testEnvironment: 'node'
};
