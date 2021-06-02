import child_process from 'child_process';
import fs from 'fs';

export function load_json_file_sync<T>(filepath: string): T {
	const contents: string = fs.readFileSync(filepath, { encoding: 'utf-8' });
	return JSON.parse(contents);
}

export function open_url(url: string): void {
	const start = (process.platform == 'darwin' ? 'open': process.platform == 'win32' ? 'start': 'xdg-open');
	child_process.exec(`${start} ${url}`);
}
