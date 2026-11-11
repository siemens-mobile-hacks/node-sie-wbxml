import Module from '#build/wbxml.js';

export const WBXML_VERSIONS = ['1.0', '1.1', '1.2', '1.3'] as const;

export const WBXML_LANGS = [
	'WML10',
	'WML11',
	'WML12',
	'WML13',
	'WTA10',
	'WTAWML12',
	'CHANNEL11',
	'CHANNEL12',
	'SI10',
	'SL10',
	'CO10',
	'PROV10',
	'EMN10',
	'DRMREL10',
	'OTA',
	'SYNCML10',
	'DEVINF10',
	'SYNCML11',
	'DEVINF11',
	'METINF11',
	'SYNCML12',
	'DEVINF12',
	'METINF12',
	'DMDDF12',
	'CSP11',
	'CSP12',
	'AIRSYNC',
	'ACTIVESYNC',
	'CONML',
] as const;

export const WBXML_CHARSETS = [
	'ASCII',
	'ISO-8859-1',
	'ISO-8859-2',
	'ISO-8859-3',
	'ISO-8859-4',
	'ISO-8859-5',
	'ISO-8859-6',
	'ISO-8859-7',
	'ISO-8859-8',
	'ISO-8859-9',
	'ISO-10646-UCS-2',
	'SHIFT_JIS',
	'BIG5',
	'UTF-8',
	'UTF-16',
] as const;

export const WBXML_GEN_MODES = ['compact', 'indent', 'canonical'] as const;

export type WBXMLVersion = typeof WBXML_VERSIONS[number];
export type WBXMLLang = typeof WBXML_LANGS[number];
export type WBXMLCharset = typeof WBXML_CHARSETS[number];
export type WBXMLGenMode = typeof WBXML_GEN_MODES[number];

export interface OptionsToWBXML {
	/** WBXML version of the output document (default: 1.3). */
	version?: WBXMLVersion | undefined;
	/** Keep ignorable whitespaces. */
	preserveWhitespace?: boolean | undefined;
	/** Do not generate the string table. */
	noStringTable?: boolean | undefined;
	/** Anonymous document: do not include public ID or DTD. */
	noPublicId?: boolean | undefined;
}

export interface OptionsFromWBXML {
	/** XML generation mode (default: indent). */
	mode?: WBXMLGenMode | undefined;
	/** Indent delta for the 'indent' mode (default: 0). */
	indent?: number | undefined;
	/** Keep ignorable whitespaces. */
	preserveWhitespace?: boolean | undefined;
	/** Force the language of the document. */
	lang?: WBXMLLang | undefined;
	/** Charset used when the document does not specify one. */
	charset?: WBXMLCharset | undefined;
}

/** Thrown when a conversion option has an unsupported value. */
export class WBXMLOptionError extends RangeError {}

const WBXML = await Module();

const _xml2wbxml = WBXML.cwrap('xml2wbxml', 'number', [
	'number', // xml_in
	'number', // xml_in_len
	'number', // out**
	'number', // out_len*
	'string', // wbxml_version
	'number', // preserve_whitespace
	'number', // no_string_table
	'number', // no_public_id
]);

const _wbxml2xml = WBXML.cwrap('wbxml2xml', 'number', [
	'number', // wbxml_in
	'number', // wbxml_in_len
	'number', // out**
	'number', // out_len*
	'number', // gen_type
	'number', // indent
	'number', // preserve_whitespace
	'string', // force_lang
	'string', // force_charset
]);

function checkOption<T extends string>(name: string, value: T | undefined, allowed: readonly T[]): void {
	if (value !== undefined && !allowed.includes(value))
		throw new WBXMLOptionError(`Unknown ${name} '${value}' (expected one of: ${allowed.join(', ')})`);
}

/**
 * Copies the input into the wasm heap, runs the converter and returns its output.
 * The converter must store a malloc'ed result (or error message) in *out / *out_len.
 */
function convert(input: Uint8Array, run: (inPtr: number, inLen: number, outPtrPtr: number, outLenPtr: number) => number): Buffer {
	const inPtr = WBXML._malloc(input.length || 1);
	const outPtrPtr = WBXML._malloc(4);
	const outLenPtr = WBXML._malloc(4);
	try {
		WBXML.HEAPU8.set(input, inPtr);
		WBXML.HEAPU32[outPtrPtr >> 2] = 0;
		WBXML.HEAPU32[outLenPtr >> 2] = 0;

		const rc = run(inPtr, input.length, outPtrPtr, outLenPtr);

		const outPtr = WBXML.HEAPU32[outPtrPtr >> 2]!;
		const outLen = WBXML.HEAPU32[outLenPtr >> 2]!;
		const result = Buffer.from(WBXML.HEAPU8.slice(outPtr, outPtr + outLen));
		WBXML._free(outPtr);

		if (rc !== 0)
			throw new Error(result.toString());
		return result;
	} finally {
		WBXML._free(inPtr);
		WBXML._free(outPtrPtr);
		WBXML._free(outLenPtr);
	}
}

/**
 * Converts an XML document to WBXML.
 * A string is encoded as UTF-8; pass raw bytes to use the encoding from the XML declaration.
 */
export function xml2wbxml(xml: string | Uint8Array, opts: OptionsToWBXML = {}): Buffer {
	const { version = '1.3' } = opts;
	checkOption('WBXML version', version, WBXML_VERSIONS);
	const input = typeof xml === 'string' ? Buffer.from(xml) : xml;
	return convert(input, (inPtr, inLen, outPtrPtr, outLenPtr) => _xml2wbxml(
		inPtr,
		inLen,
		outPtrPtr,
		outLenPtr,
		version,
		opts.preserveWhitespace ? 1 : 0,
		opts.noStringTable ? 1 : 0,
		opts.noPublicId ? 1 : 0
	));
}

/**
 * Converts a WBXML document to an XML string.
 */
export function wbxml2xml(wbxml: Uint8Array, opts: OptionsFromWBXML = {}): string {
	const { mode = 'indent', indent, lang, charset } = opts;
	checkOption('mode', mode, WBXML_GEN_MODES);
	checkOption('language', lang, WBXML_LANGS);
	checkOption('charset', charset, WBXML_CHARSETS);
	if (indent !== undefined && !(Number.isInteger(indent) && indent >= 0 && indent <= 127))
		throw new WBXMLOptionError(`Invalid indent '${indent}' (expected 0..127)`);

	return convert(wbxml, (inPtr, inLen, outPtrPtr, outLenPtr) => _wbxml2xml(
		inPtr,
		inLen,
		outPtrPtr,
		outLenPtr,
		WBXML_GEN_MODES.indexOf(mode),
		indent ?? -1,
		opts.preserveWhitespace ? 1 : 0,
		lang ?? '',
		charset ?? ''
	)).toString();
}
