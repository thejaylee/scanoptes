import fs from 'fs';

import debug from './debug.js';
import { WatchDefinition, WatchItem } from './types.js';

type JsonObj = {[k:string]: any };

export function load_watches(filepath: string): WatchDefinition[] {
	const contents: string = fs.readFileSync(filepath, { encoding: 'utf-8' });
	const json_defs: Array<JsonObj> = JSON.parse(contents);
	debug.trace('watch definitions', json_defs);
	const watches: WatchDefinition[] = [];

	for (let o of json_defs) {
		debug.trace('processing definition', o);
		let w: WatchDefinition = {
			name: String(o.name),
			url: String(o.url),
			and: [],
			or: [],
		};
		for (let j of o.and ?? []) {
			let wi: WatchItem = json2item(j);
			w.and?.push(wi);
		}
		for (let j of o.or ?? []) {
			let wi: WatchItem = json2item(j);
			w.or?.push(wi);
		}
		watches.push(w);
	}
	return watches;
}

function json2item(j: JsonObj): WatchItem {
	let wi: WatchItem = {
		element: String(j.element)
	};
	if (j.match?.length > 0)
		wi.match = new RegExp(j.match[0], j.match?.[1]);
	if (j.anyChange !== undefined)
		wi.anyChange = Boolean(j.anyChange);
	if (j.caseSensitive !== undefined)
		wi.caseSensitive = Boolean(j.caseSensitive);
	if (j.parseNumber !== undefined)
		wi.parseNumber = Boolean(j.parseNumber);
	if (j.lessThan !== undefined)
		wi.lessThan = Number(j.lessThan);
	if (j.includes !== undefined)
		wi.includes = String(j.includes);

	return wi;
}
