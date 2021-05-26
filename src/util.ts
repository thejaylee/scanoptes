import fs from 'fs';

export function loadJsonFileSync<T>(filepath: string): T {
	const contents: string = fs.readFileSync(filepath, { encoding: 'utf-8' });
	return JSON.parse(contents);
}
