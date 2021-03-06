import { WebDocument } from '../../src/web-document';
import {
	ComparisonOperator,
	NodeInspector,
	NodeInspectorContext,
	NoNodeInspectorError,
	WebDocumentInspector,
} from '../../src/inspector';
import { NodeInspectorDefinition } from '../../src/types';


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

describe('Inspector', () => {
	const ID_SELECTOR = 'div#test-id';
	const NUM_SELECTOR = 'div#numeric';

	let doc: WebDocument;

	beforeAll(() => {
		doc = new WebDocument(TEST_MARKUP);
	});

	describe('NodeInspector', () => {
		describe('selector only', () => {
			test('selector with no conditions passes if selector exists', () => {
				const ni = new NodeInspector(ID_SELECTOR, NodeInspectorContext.TEXT);
				ni.name = 'test inspector';

				expect(ni.inspect(doc)).toStrictEqual(true);
			});

			test('selector with no conditions fails if selector does not exist', () => {
				const ni = new NodeInspector('#null', NodeInspectorContext.TEXT);
				ni.name = 'test inspector';

				expect(ni.inspect(doc)).toStrictEqual(false);
			});

			test('selector with no conditions fails if selector does not exist, even with conditions', () => {
				const ni = new NodeInspector('#null', NodeInspectorContext.TEXT);
				ni.condition.match = RegExp('');
				ni.name = 'test inspector';

				expect(ni.inspect(doc)).toStrictEqual(false);
			});

			test('selector with negated conditions passes if selector does not exist', () => {
				const ni = new NodeInspector('#null', NodeInspectorContext.TEXT);
				ni.name = 'test inspector';
				ni.condition.negated = true

				expect(ni.inspect(doc)).toStrictEqual(true);
			});

			test('selector with negated no conditions fails if selector exists', () => {
				const ni = new NodeInspector(ID_SELECTOR, NodeInspectorContext.TEXT);
				ni.name = 'test inspector';
				ni.condition.negated = true

				expect(ni.inspect(doc)).toStrictEqual(false);
			});
		});

		describe('text operations', () => {
			test('text equals (case insensitive default)',	() => {
				const ni = new NodeInspector(ID_SELECTOR);
				ni.name = 'test inspector';
				ni.condition.operator = ComparisonOperator.EQ;
				ni.condition.operand = 'foo BAR';

				expect(ni.inspect(doc)).toStrictEqual(true);
			});

			test('text not equals (case insensitive default)',	() => {
				const ni = new NodeInspector(ID_SELECTOR);
				ni.name = 'test inspector';
				ni.condition.operator = ComparisonOperator.NE;
				ni.condition.operand = 'something else';

				expect(ni.inspect(doc)).toStrictEqual(true);
			});

			test('text equals, case sensitive',  () => {
				const ni = new NodeInspector(ID_SELECTOR);
				ni.name = 'test inspector';
				ni.condition.operator = ComparisonOperator.EQ;
				ni.condition.operand = 'foo bar';
				ni.condition.caseSensitive = true;

				expect(ni.inspect(doc)).toStrictEqual(true);
			});

			test('text not equals, case sensitive',  () => {
				const ni = new NodeInspector(ID_SELECTOR);
				ni.name = 'test inspector';
				ni.condition.operator = ComparisonOperator.EQ;
				ni.condition.operand = 'FOO BAR';
				ni.condition.caseSensitive = true;

				expect(ni.inspect(doc)).toStrictEqual(false);
			});

			test('text includes, case insensitive',  () => {
				const ni = new NodeInspector(ID_SELECTOR);
				ni.name = 'test inspector';
				ni.condition.operator = ComparisonOperator.INC;
				ni.condition.operand = 'OO BA';

				expect(ni.inspect(doc)).toStrictEqual(true);
			});

			test('text includes, case sensitive',  () => {
				const ni = new NodeInspector(ID_SELECTOR);
				ni.name = 'test inspector';
				ni.condition.operator = ComparisonOperator.INC;
				ni.condition.operand = 'o b';

				expect(ni.inspect(doc)).toStrictEqual(true);
			});

			test('text includes, fails with extra chars',  () => {
				const ni = new NodeInspector(ID_SELECTOR);
				ni.name = 'test inspector';
				ni.condition.operator = ComparisonOperator.INC;
				ni.condition.operand = 'foo foo bar';

				expect(ni.inspect(doc)).toStrictEqual(false);
			});
		});

		describe('numeric operations', () => {
			test('$###,###.### parses and equals', () => {
				const ni = new NodeInspector(NUM_SELECTOR);
				ni.name = 'test inspector';
				ni.condition.operator = ComparisonOperator.EQ;
				ni.condition.operand = 123456.789;

				expect(ni.inspect(doc)).toStrictEqual(true);
			});

			describe('equality', () => {
				test('passes when equals', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.EQ;
					ni.condition.operand = 123456.789;

					expect(ni.inspect(doc)).toStrictEqual(true);
				});

				test('fails when less', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.EQ;
					ni.condition.operand = 123456.79;

					expect(ni.inspect(doc)).toStrictEqual(false);
				});

				test('fails when greater', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.EQ;
					ni.condition.operand = 123455.123;

					expect(ni.inspect(doc)).toStrictEqual(false);
				});
			});

			describe('inequality', () => {
				test('fails when equals', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.NE;
					ni.condition.operand = 123456.789;

					expect(ni.inspect(doc)).toStrictEqual(false);
				});

				test('passes when less', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.NE;
					ni.condition.operand = 123456.79;

					expect(ni.inspect(doc)).toStrictEqual(true);
				});

				test('passes when greater', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.NE;
					ni.condition.operand = 123455.123;

					expect(ni.inspect(doc)).toStrictEqual(true);
				});
			});

			describe('less than', () => {
				test('passes when less', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.LT;
					ni.condition.operand = 123456.79;

					expect(ni.inspect(doc)).toStrictEqual(true);
				});

				test('fails when equal to', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.LT;
					ni.condition.operand = 123456.789;

					expect(ni.inspect(doc)).toStrictEqual(false);
				});

				test('fails when greater', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.LT;
					ni.condition.operand = 123456.788;

					expect(ni.inspect(doc)).toStrictEqual(false);
				});
			});

			describe('less than equals', () => {
				test('passes when less', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.LTE;
					ni.condition.operand = 123456.79;

					expect(ni.inspect(doc)).toStrictEqual(true);
				});

				test('passes when equal to', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.LTE;
					ni.condition.operand = 123456.789;

					expect(ni.inspect(doc)).toStrictEqual(true);
				});

				test('fails when greater', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.LTE;
					ni.condition.operand = 123456.788;

					expect(ni.inspect(doc)).toStrictEqual(false);
				});
			});

			describe('greater than', () => {
				test('fails when less', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.GT;
					ni.condition.operand = 123456.79;

					expect(ni.inspect(doc)).toStrictEqual(false);
				});

				test('fails when equal to', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.GT;
					ni.condition.operand = 123456.789;

					expect(ni.inspect(doc)).toStrictEqual(false);
				});

				test('passes when greater', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.GT;
					ni.condition.operand = 123456.788;

					expect(ni.inspect(doc)).toStrictEqual(true);
				});
			});

			describe('greater than equals', () => {
				test('fails when less', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.GTE;
					ni.condition.operand = 123456.79;

					expect(ni.inspect(doc)).toStrictEqual(false);
				});

				test('passes when equal to', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.GTE;
					ni.condition.operand = 123456.789;

					expect(ni.inspect(doc)).toStrictEqual(true);
				});

				test('passes when greater', () => {
					const ni = new NodeInspector(NUM_SELECTOR);
					ni.name = 'test inspector';
					ni.condition.operator = ComparisonOperator.GTE;
					ni.condition.operand = 123456.788;

					expect(ni.inspect(doc)).toStrictEqual(true);
				});
			});
		});

		describe('mutation', () => {
			test('anyChange detects TEXT change in specific node', () => {
				const ni = new NodeInspector('#test', NodeInspectorContext.TEXT);
				const doc1 = new WebDocument('<div id="test">foo bar</div>');
				const doc2 = new WebDocument('<div id="test">FOO BAR</div>');
				const doc3 = new WebDocument('<div id="test">FOO BAR</div><div id="null">nothing</div>');
				ni.name = 'test inspector';
				ni.condition.anyChange = true;

				// check doc1 twice for sanity
				expect(ni.inspect(doc1)).toStrictEqual(false);
				expect(ni.inspect(doc1)).toStrictEqual(false);
				expect(ni.inspect(doc2)).toStrictEqual(true);
				expect(ni.inspect(doc3)).toStrictEqual(false);
			});

			test('anyChange ignores TEXT change when blank tag added', () => {
				const ni = new NodeInspector('#test', NodeInspectorContext.TEXT);
				const doc1 = new WebDocument('<div id="test">foo bar</div>');
				const doc2 = new WebDocument('<div id="test">foo bar<div id="null"></div></div>');
				ni.name = 'test inspector';
				ni.condition.anyChange = true;

				expect(ni.inspect(doc1)).toStrictEqual(false);
				expect(ni.inspect(doc2)).toStrictEqual(false);
			});

			test('anyChange detects HTML change when blank tag added', () => {
				const ni = new NodeInspector('#test', NodeInspectorContext.HTML);
				const doc1 = new WebDocument('<div id="test">foo bar</div>');
				const doc2 = new WebDocument('<div id="test">foo bar<div id="null"></div></div></div>');
				ni.name = 'test inspector';
				ni.condition.anyChange = true;

				expect(ni.inspect(doc1)).toStrictEqual(false);
				expect(ni.inspect(doc2)).toStrictEqual(true);
			});
		});

		describe('fromDefinition', () => {
			test('creates proper NodeInspector with all definition properties', () => {
				const nid: NodeInspectorDefinition = {
					selector: ID_SELECTOR,
					context: 'TEXT',
					name: 'test',
					condition: {
						operator: 'eq',
						operand: 'foobar',
						negated: true,
						match: ['^asdf$', 'i'],
						caseSensitive: false,
					}
				};
				const ni = NodeInspector.fromDefinition(nid);

				expect(ni.selector).toEqual(ID_SELECTOR);
				expect(ni.context).toEqual(NodeInspectorContext.TEXT);
				expect(ni.name).toEqual('test');
				expect(ni.condition.operator).toEqual(ComparisonOperator.EQ);
				expect(ni.condition.operand).toEqual('foobar');
				expect(ni.condition.negated).toEqual(true);
				expect(ni.condition.match).toEqual(RegExp('^asdf$', 'i'));
				expect(ni.condition.caseSensitive).toEqual(false);
			});
		});
	});

	describe('WebDocumentInspector', () => {
		describe('inspect()', () => {
			test('without any NodeInspectors throws NoNodeInspectorError', () => {
				const doc = new WebDocument(TEST_MARKUP);
				const wdi = new WebDocumentInspector();

				expect(() => {
					wdi.inspect(doc);
				}).toThrow(NoNodeInspectorError);
			});

			describe('matching all', () => {
				test('passes when ALL inspectors match', () => {
					const all: NodeInspectorDefinition[] = [
						{
							selector: ID_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 'foo bar',
							}
						},{
							selector: NUM_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 123456.789,
							}
						},
					];
					const wdi = new WebDocumentInspector();
					wdi.loadNodeInspectorDefinitions({all});

					expect(wdi.inspect(doc)).toStrictEqual(true);
				});

				test('fails when not ALL inspectors match', () => {
					const all: NodeInspectorDefinition[] = [
						{
							selector: ID_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 'does not exist',
							}
						},{
							selector: NUM_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 123456.789,
							}
						},
					];
					const wdi = new WebDocumentInspector();
					wdi.loadNodeInspectorDefinitions({all});

					expect(wdi.inspect(doc)).toStrictEqual(false);
				});

				test('fails when a selector is not found', () => {
					const all: NodeInspectorDefinition[] = [
						{
							selector: '#null',
							context: 'TEXT',
							name: 'test',
							condition: {}
						},{
							selector: NUM_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 123456.789,
							}
						},
					];
					const wdi = new WebDocumentInspector();
					wdi.loadNodeInspectorDefinitions({all});

					expect(wdi.inspect(doc)).toStrictEqual(false);
				});
			});

			describe('matching any', () => {
				test('passes when not all inspectors match', () => {
					const any: NodeInspectorDefinition[] = [
						{
							selector: ID_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 'will not match',
							}
						},{
							selector: NUM_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 123456.789,
							}
						},
					];
					const wdi = new WebDocumentInspector();
					wdi.loadNodeInspectorDefinitions({any});

					expect(wdi.inspect(doc)).toStrictEqual(true);
				});

				test('passes when an inspector matches and one not found', () => {
					const any: NodeInspectorDefinition[] = [
						{
							selector: ID_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 'foo bar',
							}
						},{
							selector: '#null',
							context: 'TEXT',
							name: 'test',
							condition: {}
						},
					];
					const wdi = new WebDocumentInspector();
					wdi.loadNodeInspectorDefinitions({any});

					expect(wdi.inspect(doc)).toStrictEqual(true);
				});

				test('fails when none match', () => {
					const any: NodeInspectorDefinition[] = [
						{
							selector: '#null',
							context: 'TEXT',
							name: 'test',
							condition: {}
						},{
							selector: ID_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 'will not match',
							}
						},
					];
					const wdi = new WebDocumentInspector();
					wdi.loadNodeInspectorDefinitions({any});

					expect(wdi.inspect(doc)).toStrictEqual(false);
				});
			});

			describe('matching any and all', () => {
				test('passes when any and all pass', () => {
					const all: NodeInspectorDefinition[] = [
						{
							selector: ID_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 'foo bar',
							}
						},{
							selector: NUM_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 123456.789,
							}
						},
					];
					const any: NodeInspectorDefinition[] = [
						{
							selector: ID_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 'foo bar',
							}
						},{
							selector: '#null',
							context: 'TEXT',
							name: 'test',
							condition: {}
						},
					];
					const wdi = new WebDocumentInspector();
					wdi.loadNodeInspectorDefinitions({all, any});

					expect(wdi.inspect(doc)).toStrictEqual(true);
				});

				test('fails when any passes but all fails', () => {
					const all: NodeInspectorDefinition[] = [
						{
							selector: ID_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 'will not exist',
							}
						}
					];
					const any: NodeInspectorDefinition[] = [
						{
							selector: ID_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 'foo bar',
							}
						},{
							selector: '#null',
							context: 'TEXT',
							name: 'test',
							condition: {}
						},
					];
					const wdi = new WebDocumentInspector();
					wdi.loadNodeInspectorDefinitions({all, any});

					expect(wdi.inspect(doc)).toStrictEqual(false);
				});

				test('fails when all passes but any fails', () => {
					const all: NodeInspectorDefinition[] = [
						{
							selector: ID_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 'foo bar',
							}
						},{
							selector: NUM_SELECTOR,
							context: 'TEXT',
							name: 'test',
							condition: {
								operator: 'eq',
								operand: 123456.789,
							}
						},

					];
					const any: NodeInspectorDefinition[] = [
						{
							selector: '#null',
							context: 'TEXT',
							name: 'test',
							condition: {}
						}
					];
					const wdi = new WebDocumentInspector();
					wdi.loadNodeInspectorDefinitions({all, any});

					expect(wdi.inspect(doc)).toStrictEqual(false);
				});
			});
		});
	});
});
