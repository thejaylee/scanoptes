import { Logger, LogLevel } from '../../src/log';

describe('Logger', () => {
	test('writes to logoutputfunc', () => {
		const outputFn = jest.fn().mockName('Logger Output func');
		const log = new Logger(outputFn, [LogLevel.info]);
		const value = 'foo bar';

		log.info(value);

		expect(outputFn).toBeCalled();
	});

	test('writes output with level', () => {
		const outputFn = jest.fn().mockName('Logger Output func');
		const log = new Logger(outputFn, [LogLevel.trace, LogLevel.debug, LogLevel.info, LogLevel.warn, LogLevel.error]);
		const value = 'foo bar';

		log.trace(value);
		log.debug(value);
		log.info(value);
		log.warn(value);
		log.error(value);

		expect(outputFn.mock.calls).toEqual(
			expect.arrayContaining([
				[expect.anything(), expect.stringContaining('TRACE'), value],
				[expect.anything(), expect.stringContaining('DEBUG'), value],
				[expect.anything(), expect.stringContaining('INFO'), value],
				[expect.anything(), expect.stringContaining('WARN'), value],
				[expect.anything(), expect.stringContaining('ERROR'), value],
			]),
		);
	});

	test('writes output after changing levels', () => {
		const outputFn = jest.fn().mockName('Logger Output func');
		const log = new Logger(outputFn, [LogLevel.info]);
		const value = 'foo bar';

		log.trace(value);
		expect(outputFn).not.toBeCalled();

		log.levels = [LogLevel.info, LogLevel.trace];
		log.trace(value);
		expect(outputFn).toBeCalledTimes(1);
	});

	test('does not write to LogOutputFunc if called with unset level', () => {
		const outputFn = jest.fn().mockName('Logger Output func');
		const log = new Logger(outputFn, [LogLevel.info]);
		const value = 'foo bar';

		log.trace(value);

		expect(outputFn).not.toBeCalled();
	});
});
