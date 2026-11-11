import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs, type ParseArgsConfig } from 'node:util';
import {
	wbxml2xml,
	xml2wbxml,
	WBXML_GEN_MODES,
	WBXML_VERSIONS,
	WBXMLOptionError,
	type WBXMLCharset,
	type WBXMLGenMode,
	type WBXMLLang,
	type WBXMLVersion,
} from './index.js';

class UsageError extends Error {}

const LANG_DESCRIPTIONS: Record<WBXMLLang, string> = {
	WML10: 'WML 1.0',
	WML11: 'WML 1.1',
	WML12: 'WML 1.2',
	WML13: 'WML 1.3',
	WTA10: 'WTA 1.0',
	WTAWML12: 'WTAWML 1.2',
	CHANNEL11: 'CHANNEL 1.1',
	CHANNEL12: 'CHANNEL 1.2',
	SI10: 'SI 1.0 (Service Indication)',
	SL10: 'SL 1.0 (Service Loading)',
	CO10: 'CO 1.0 (Cache Operation)',
	PROV10: 'PROV 1.0 (OMA Provisioning)',
	EMN10: 'EMN 1.0 (E-Mail Notification)',
	DRMREL10: 'DRMREL 1.0 (DRM Rights Expression)',
	OTA: 'OTA Settings (Nokia/Ericsson)',
	SYNCML10: 'SyncML 1.0',
	DEVINF10: 'SyncML DevInf 1.0',
	SYNCML11: 'SyncML 1.1',
	DEVINF11: 'SyncML DevInf 1.1',
	METINF11: 'SyncML MetInf 1.1',
	SYNCML12: 'SyncML 1.2',
	DEVINF12: 'SyncML DevInf 1.2',
	METINF12: 'SyncML MetInf 1.2',
	DMDDF12: 'SyncML DM DDF 1.2',
	CSP11: 'Wireless Village CSP 1.1',
	CSP12: 'Wireless Village CSP 1.2',
	AIRSYNC: 'Microsoft AirSync (SynCE namespaces)',
	ACTIVESYNC: 'Microsoft ActiveSync (original namespaces)',
	CONML: 'Nokia ConML',
};

const CHARSET_DESCRIPTIONS: Record<WBXMLCharset, string> = {
	'ASCII': 'US ASCII',
	'ISO-8859-1': 'Western European',
	'ISO-8859-2': 'Central European',
	'ISO-8859-3': 'South European',
	'ISO-8859-4': 'North European',
	'ISO-8859-5': 'Latin/Cyrillic',
	'ISO-8859-6': 'Latin/Arabic',
	'ISO-8859-7': 'Latin/Greek',
	'ISO-8859-8': 'Latin/Hebrew',
	'ISO-8859-9': 'Latin/Turkish',
	'ISO-10646-UCS-2': 'UCS-2',
	'SHIFT_JIS': 'Shift JIS (Japanese)',
	'BIG5': 'Big5 (Chinese)',
	'UTF-8': 'UTF-8',
	'UTF-16': 'UTF-16',
};

function getPackageVersion(): string {
	const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
	return pkg.version;
}

function formatList(descriptions: Record<string, string>): string {
	const width = Math.max(...Object.keys(descriptions).map((k) => k.length));
	return Object.entries(descriptions)
		.map(([name, descr]) => `  ${name.padEnd(width)}  ${descr}`)
		.join('\n');
}

// libwbxml tools accept the generation mode as a number.
function parseMode(value: string | undefined): string | undefined {
	if (value !== undefined && /^\d+$/.test(value))
		return WBXML_GEN_MODES[Number(value)] ?? value;
	return value;
}

async function readInput(file: string | undefined): Promise<Buffer> {
	if (file !== undefined && file !== '-')
		return readFile(file);
	if (process.stdin.isTTY)
		throw new UsageError('no input file given and stdin is a terminal');
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin)
		chunks.push(chunk);
	return Buffer.concat(chunks);
}

async function writeOutput(file: string | undefined, data: string | Uint8Array): Promise<void> {
	if (file !== undefined && file !== '-')
		return writeFile(file, data);
	await new Promise<void>((resolve, reject) => {
		process.stdout.write(data, (err) => err ? reject(err) : resolve());
	});
}

function parse<T extends NonNullable<ParseArgsConfig['options']>>(argv: string[], options: T) {
	try {
		return parseArgs({ args: argv, options, allowPositionals: true, strict: true });
	} catch (e) {
		throw new UsageError((e as Error).message);
	}
}

function getSingleInput(positionals: string[]): string | undefined {
	if (positionals.length > 1)
		throw new UsageError(`too many input files: ${positionals.join(' ')}`);
	return positionals[0];
}

const WBXML2XML_HELP = `Usage: wbxml2xml [options] [input.wbxml]

Convert a WBXML document to XML.
Reads from stdin when input is omitted or '-'; writes to stdout unless -o is given.

Options:
  -o, --output <file>       Output file ('-' for stdout, default)
  -m, --mode <mode>         Generation mode (default: indent):
                              0, compact    Compact generation
                              1, indent     Indent generation
                              2, canonical  Canonical generation
  -i, --indent <n>          Indent delta for the indent mode (default: 0)
  -k, --keep-whitespace     Keep ignorable whitespaces
  -l, --lang <lang>         Force language type of the document (see --list-langs)
  -c, --charset <charset>   Charset to use if the document does not specify one
                            (see --list-charsets)
      --list-langs          List supported languages
      --list-charsets       List supported charsets
  -h, --help                Show this help
  -V, --version             Show version

Examples:
  wbxml2xml -o output.xml input.wbxml
  wbxml2xml -i 4 -l CSP12 input.wbxml > output.xml
  cat input.wbxml | wbxml2xml -m compact
`;

const XML2WBXML_HELP = `Usage: xml2wbxml [options] [input.xml]

Convert an XML document to WBXML.
Reads from stdin when input is omitted or '-'; writes to stdout unless -o is given.

Options:
  -o, --output <file>         Output file ('-' for stdout)
  -v, --wbxml-version <ver>   WBXML version of the output document: ${WBXML_VERSIONS.join(', ')} (default: 1.3)
  -k, --keep-whitespace       Keep ignorable whitespaces
  -n, --no-string-table       Do not generate the string table
  -a, --anonymous             Anonymous format: do not include any format
                              information (public ID or DTD)
  -h, --help                  Show this help
  -V, --version               Show version

Examples:
  xml2wbxml -o output.wbxml input.xml
  xml2wbxml -k -n -v 1.1 -o output.wbxml input.xml
  xml2wbxml input.xml | xxd
`;

const WBXML_HELP = `Usage: wbxml <command> [options] [input]

Commands:
  decode, wbxml2xml   Convert WBXML to XML (see 'wbxml decode --help')
  encode, xml2wbxml   Convert XML to WBXML (see 'wbxml encode --help')
  langs               List supported languages
  charsets            List supported charsets

Options:
  -h, --help          Show this help
  -V, --version       Show version
`;

async function runWbxml2xml(argv: string[]): Promise<void> {
	const { values, positionals } = parse(argv, {
		'output': { type: 'string', short: 'o' },
		'mode': { type: 'string', short: 'm' },
		'indent': { type: 'string', short: 'i' },
		'keep-whitespace': { type: 'boolean', short: 'k' },
		'lang': { type: 'string', short: 'l' },
		'charset': { type: 'string', short: 'c' },
		'list-langs': { type: 'boolean' },
		'list-charsets': { type: 'boolean' },
		'help': { type: 'boolean', short: 'h' },
		'version': { type: 'boolean', short: 'V' },
	});

	if (values.help) {
		process.stdout.write(WBXML2XML_HELP);
		return;
	}
	if (values.version) {
		process.stdout.write(`wbxml2xml (@sie-js/wbxml) ${getPackageVersion()}\n`);
		return;
	}
	if (values['list-langs'] || values['list-charsets']) {
		if (values['list-langs'])
			process.stdout.write(`Languages:\n${formatList(LANG_DESCRIPTIONS)}\n`);
		if (values['list-charsets'])
			process.stdout.write(`Charsets:\n${formatList(CHARSET_DESCRIPTIONS)}\n`);
		return;
	}

	const input = await readInput(getSingleInput(positionals));
	let xml: string;
	try {
		xml = wbxml2xml(input, {
			mode: parseMode(values.mode) as WBXMLGenMode | undefined,
			indent: values.indent === undefined ? undefined : Number(values.indent),
			preserveWhitespace: values['keep-whitespace'],
			lang: values.lang as WBXMLLang | undefined,
			charset: values.charset as WBXMLCharset | undefined,
		});
	} catch (e) {
		if (values.lang === undefined && (e as Error).message === 'Unknown Public ID')
			throw new Error('Unknown Public ID (the document has no known public ID, use -l <lang> to force the language; see --list-langs)');
		throw e;
	}
	await writeOutput(values.output, xml);
}

async function runXml2wbxml(argv: string[]): Promise<void> {
	const { values, positionals } = parse(argv, {
		'output': { type: 'string', short: 'o' },
		'wbxml-version': { type: 'string', short: 'v' },
		'keep-whitespace': { type: 'boolean', short: 'k' },
		'no-string-table': { type: 'boolean', short: 'n' },
		'anonymous': { type: 'boolean', short: 'a' },
		'help': { type: 'boolean', short: 'h' },
		'version': { type: 'boolean', short: 'V' },
	});

	if (values.help) {
		process.stdout.write(XML2WBXML_HELP);
		return;
	}
	if (values.version) {
		process.stdout.write(`xml2wbxml (@sie-js/wbxml) ${getPackageVersion()}\n`);
		return;
	}

	if (values.output === undefined && process.stdout.isTTY)
		throw new UsageError(`refusing to write binary WBXML to a terminal (use -o <file>, or '-o -' to force)`);

	const input = await readInput(getSingleInput(positionals));
	const wbxml = xml2wbxml(input, {
		version: values['wbxml-version'] as WBXMLVersion | undefined,
		preserveWhitespace: values['keep-whitespace'],
		noStringTable: values['no-string-table'],
		noPublicId: values.anonymous,
	});
	await writeOutput(values.output, wbxml);
}

async function runWbxml(argv: string[]): Promise<void> {
	const [command, ...rest] = argv;
	switch (command) {
		case 'decode':
		case 'wbxml2xml':
			await runWbxml2xml(rest);
			break;
		case 'encode':
		case 'xml2wbxml':
			await runXml2wbxml(rest);
			break;
		case 'langs':
			process.stdout.write(`${formatList(LANG_DESCRIPTIONS)}\n`);
			break;
		case 'charsets':
			process.stdout.write(`${formatList(CHARSET_DESCRIPTIONS)}\n`);
			break;
		case '-h':
		case '--help':
			process.stdout.write(WBXML_HELP);
			break;
		case '-V':
		case '--version':
			process.stdout.write(`wbxml (@sie-js/wbxml) ${getPackageVersion()}\n`);
			break;
		case undefined:
			process.stderr.write(WBXML_HELP);
			process.exitCode = 2;
			break;
		default:
			throw new UsageError(`unknown command '${command}' (see 'wbxml --help')`);
	}
}

const TOOLS = {
	wbxml: runWbxml,
	wbxml2xml: runWbxml2xml,
	xml2wbxml: runXml2wbxml,
};

export async function main(tool: keyof typeof TOOLS): Promise<void> {
	// Output closed early (e.g. piped to head): exit quietly.
	process.stdout.on('error', (err: NodeJS.ErrnoException) => {
		if (err.code !== 'EPIPE')
			throw err;
		process.exit(process.exitCode ?? 0);
	});

	try {
		await TOOLS[tool](process.argv.slice(2));
	} catch (e) {
		const err = e as Error;
		if (err instanceof UsageError || err instanceof WBXMLOptionError) {
			process.stderr.write(`${tool}: ${err.message}\nTry '${tool} --help' for more information.\n`);
			process.exitCode = 2;
		} else {
			process.stderr.write(`${tool}: ${err.message}\n`);
			process.exitCode = 1;
		}
	}
}
