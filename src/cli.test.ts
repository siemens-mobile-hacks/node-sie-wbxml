import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { wbxml2xml, xml2wbxml } from './index.js';

const OTA_XML = `<?xml version="1.0"?>
<!DOCTYPE CHARACTERISTIC-LIST SYSTEM "characteristic-list.dtd">
<CHARACTERISTIC-LIST>
    <CHARACTERISTIC TYPE="BOOKMARK">
        <PARM NAME="NAME" VALUE="Привет"/>
    </CHARACTERISTIC>
</CHARACTERISTIC-LIST>
`;
const OTA_WBXML = xml2wbxml(OTA_XML);

// Repeated text with ignorable whitespace: affected by -k and -n
const WML_XML = '<?xml version="1.0"?><!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">' +
	'<wml><card><p> Привет, мир </p><p> Привет, мир </p></card></wml>';
const WML_WBXML = xml2wbxml(WML_XML, { preserveWhitespace: true });

// No binary public ID: affected by -a
const CSP_XML = '<?xml version="1.0"?><!DOCTYPE WV-CSP-Message PUBLIC "-//OMA//DTD WV-CSP 1.2//EN" "http://www.openmobilealliance.org/DTD/WV-CSP.DTD">' +
	'<WV-CSP-Message xmlns="http://www.wireless-village.org/CSP1.1"><Session><SessionDescriptor><SessionType>Outband</SessionType></SessionDescriptor></Session></WV-CSP-Message>';

// Text in ISO-8859-5 without a declared charset: affected by -c
const NO_CHARSET_WBXML = Buffer.from('030a00007f676003bfe0d8d2d5e200010101', 'hex');

const workDir = mkdtempSync(join(tmpdir(), 'wbxml-cli-'));
afterAll(() => rmSync(workDir, { recursive: true }));

function run(tool: string, args: string[], input?: string | Buffer) {
	const bin = new URL(`./bin/${tool}.ts`, import.meta.url).pathname;
	const result = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), bin, ...args], { cwd: workDir, input: input ?? '' });
	return { code: result.status, stdout: result.stdout, stderr: result.stderr.toString() };
}

describe('xml2wbxml', () => {
	it('converts stdin to stdout', () => {
		const result = run('xml2wbxml', [], OTA_XML);
		expect(result).toMatchObject({ code: 0, stderr: '' });
		expect(result.stdout).toEqual(OTA_WBXML);
	});

	it('converts a file to a file', () => {
		writeFileSync(join(workDir, 'in.xml'), OTA_XML);
		expect(run('xml2wbxml', ['-o', 'out.wbxml', 'in.xml']).code).toBe(0);
		expect(readFileSync(join(workDir, 'out.wbxml'))).toEqual(OTA_WBXML);
	});

	// Each flag on its own: with all flags at once, swapped mappings would go unnoticed
	it.each([
		[['-k'], { preserveWhitespace: true }, WML_XML],
		[['-n'], { noStringTable: true }, WML_XML],
		[['-v', '1.1'], { version: '1.1' }, WML_XML],
		[['-a'], { noPublicId: true }, CSP_XML],
	] as const)('maps %j to the library', (args, options, xml) => {
		expect(run('xml2wbxml', [...args], xml).stdout).toEqual(xml2wbxml(xml, options));
	});
});

describe('wbxml2xml', () => {
	it.each([
		[['-i', '2'], { indent: 2 }, WML_WBXML],
		[['-k'], { preserveWhitespace: true }, WML_WBXML],
		[['-l', 'OTA'], { lang: 'OTA' }, OTA_WBXML],
		[['-c', 'ISO-8859-5'], { charset: 'ISO-8859-5' }, NO_CHARSET_WBXML],
	] as const)('maps %j to the library', (args, options, wbxml) => {
		const result = run('wbxml2xml', [...args], wbxml);
		expect(result).toMatchObject({ code: 0, stderr: '' });
		expect(result.stdout.toString()).toBe(wbxml2xml(wbxml, options));
	});

	it('accepts the generation mode as a number, like libwbxml tools', () => {
		const expected = wbxml2xml(OTA_WBXML, { lang: 'OTA', mode: 'compact' });
		expect(run('wbxml2xml', ['-l', 'OTA', '-m', '0'], OTA_WBXML).stdout.toString()).toBe(expected);
		expect(run('wbxml2xml', ['-l', 'OTA', '-m', 'compact'], OTA_WBXML).stdout.toString()).toBe(expected);
	});

	it('suggests a language for documents without a public ID', () => {
		const result = run('wbxml2xml', [], OTA_WBXML);
		expect(result.code).toBe(1);
		expect(result.stderr).toContain('use -l <lang>');
	});

	it('reports invalid arguments as usage errors', () => {
		const cases = [
			['-l', 'FOO'], // rejected by the library
			['-m', '9'], // not a generation mode number
			['-x'], // unknown option
			['a.wbxml', 'b.wbxml'], // more than one input
		];
		for (const args of cases) {
			const result = run('wbxml2xml', args, OTA_WBXML);
			expect(result.code, args.join(' ')).toBe(2);
			expect(result.stderr).toContain(`Try 'wbxml2xml --help'`);
		}
	});
});

describe('wbxml', () => {
	it('dispatches commands', () => {
		expect(run('wbxml', ['encode'], OTA_XML).stdout).toEqual(OTA_WBXML);
		expect(run('wbxml', ['decode', '-l', 'OTA'], OTA_WBXML).stdout.toString()).toBe(wbxml2xml(OTA_WBXML, { lang: 'OTA' }));
	});

	it('prints the package version', () => {
		const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
		expect(run('wbxml', ['--version']).stdout.toString()).toBe(`wbxml (@sie-js/wbxml) ${version}\n`);
	});
});
