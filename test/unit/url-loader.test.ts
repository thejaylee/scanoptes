import nock from 'nock';

import { NotHttpUrlError, UrlLoader } from '../../src/url-loader';

describe('UrlLoader', () => {
	const TEST_MARKUP = "\
	<html> \
	<head> \
		<title>test document</title> \
	</head> \
	<body> \
		<div id='test-id'>foo bar</div> \
		<div> \
			<div id='numeric'>foo $123,456.789 bar</div> \
		</div> \
	</body> \
	</html>";

	test('constructs with http:// URL', () => {
		expect(() => {
			new UrlLoader('http://test.site');
		}).not.toThrow(NotHttpUrlError);
	});

	test('constructs with https:// URL', () => {
		expect(() => {
			new UrlLoader('https://test.site');
		}).not.toThrow(NotHttpUrlError);
	});

	test('non-http(s) protocol throws error', () => {
		expect(() => {
			new UrlLoader('file://some/file');
		}).toThrow(NotHttpUrlError);
	});

	test('setting Accept header has no effect, remains */*', () => {
		const loader = new UrlLoader('https://some.site');
		loader.headers = {
			'Accept': 'text/html',
		}
		expect(loader.headers['Accept']).toEqual('*/*');
	});

	test('setting Accept-Encoding header has no effect, remains identity', () => {
		const loader = new UrlLoader('http://some.site');
		loader.headers = {
			'Accept-Encoding': 'deflate',
		}
		expect(loader.headers['Accept-Encoding']).toEqual('identity');
	});

	describe('requests', () => {
		test('loads http page', async () => {
			const scope = nock('http://some.site')
				.get('/page')
				.reply(200, TEST_MARKUP, { 'Content-Type': 'text/html' });
			const loader = new UrlLoader('http://some.site/page');
			const [code, buf] = await loader.load();

			expect(code).toStrictEqual(200);
			expect(buf.compare(Buffer.from(TEST_MARKUP))).toStrictEqual(0);
			scope.done();
		});

		test('sends user-agent, accept, accept-encoding by default', async () => {
			const header_scope = nock('http://some.site', {
				reqheaders: {
					'User-Agent': 'scanoptes',
					Accept: '*/*',
					'Accept-Encoding': 'identity',
				}
			})
				.get('/page')
				.reply(200, TEST_MARKUP, { 'Content-Type': 'text/html' });

			const loader = new UrlLoader('http://some.site/page');
			const [code, buf] = await loader.load();

			expect(code).toStrictEqual(200);
			expect(buf.compare(Buffer.from(TEST_MARKUP))).toStrictEqual(0);
			header_scope.done();
		});
	});
});
