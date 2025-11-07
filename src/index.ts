import Module from "#build/wbxml.js";

export type WBXMLVersion = "1.0" | "1.1" | "1.2" | "1.3";

export type WBXMLLang =
	| "WML10"
	| "WML11"
	| "WML12"
	| "WML13"
	| "WTA10"
	| "WTAWML12"
	| "CHANNEL11"
	| "CHANNEL12"
	| "SI10"
	| "SL10"
	| "CO10"
	| "PROV10"
	| "EMN10"
	| "DRMREL10"
	| "OTA"
	| "SYNCML10"
	| "DEVINF10"
	| "SYNCML11"
	| "DEVINF11"
	| "METINF11"
	| "SYNCML12"
	| "DEVINF12"
	| "METINF12"
	| "DMDDF12"
	| "CSP11"
	| "CSP12"
	| "AIRSYNC"
	| "ACTIVESYNC"
	| "CONML";

export type WBXMLCharset =
	| "ASCII"
	| "ISO-8859-1"
	| "ISO-8859-2"
	| "ISO-8859-3"
	| "ISO-8859-4"
	| "ISO-8859-5"
	| "ISO-8859-6"
	| "ISO-8859-7"
	| "ISO-8859-8"
	| "ISO-8859-9"
	| "ISO-10646-UCS-2"
	| "SHIFT_JIS"
	| "BIG5"
	| "UTF-8"
	| "UTF-16";

interface OptionsToWBXML {
	version?: WBXMLVersion;
	preserveWhitespace?: boolean;
	noStringTable?: boolean;
	noPublicId?: boolean;
}

interface OptionsFromWBXML {
	mode?: "compact" | "indent" | "canonical";
	indent?: number;
	preserveWhitespace?: boolean;
	lang?: WBXMLLang;
	charset?: WBXMLCharset;
}

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

const _wbxml2xml = WBXML.cwrap("wbxml2xml", "number", [
	"number", // wbxml_in
	"number", // wbxml_in_len
	"number", // out
	"number", // out_len
	"number", // gen_type
	"number", // indent
	"number", // preserve_whitespace
	"string", // force_lang
	"string", // force_charset
]);

export function xml2wbxml(xml: string, opts: OptionsToWBXML = {}): Buffer {
	const {
		version = "1.3",
		preserveWhitespace = false,
		noStringTable = false,
		noPublicId = false,
	} = opts;

	const xmlBytes = Buffer.from(xml);
	const xmlPtr = WBXML._malloc(xmlBytes.length || 1);
	WBXML.HEAPU8.set(xmlBytes, xmlPtr);

	const outPtrPtr = WBXML._malloc(4);
	const outLenPtr = WBXML._malloc(4);
	WBXML.HEAPU32[outPtrPtr >> 2] = 0;
	WBXML.HEAPU32[outLenPtr >> 2] = 0;

	const rc = _xml2wbxml(
		xmlPtr,
		xmlBytes.length,
		outPtrPtr,
		outLenPtr,
		version,
		preserveWhitespace ? 1 : 0,
		noStringTable ? 1 : 0,
		noPublicId ? 1 : 0
	);

	const outPtr = WBXML.HEAPU32[outPtrPtr >> 2] >>> 0;
	const outLen = WBXML.HEAPU32[outLenPtr >> 2] >>> 0;
	const result = Buffer.from(WBXML.HEAPU8.slice(outPtr, outPtr + outLen));

	WBXML._free(xmlPtr);
	WBXML._free(outPtrPtr);
	WBXML._free(outLenPtr);
	WBXML._free(outPtr);

	if (rc !== 0)
		throw new Error(result.toString());

	return result;
}
export function wbxml2xml(wbxml: Buffer, opts: OptionsFromWBXML = {}): string {
	const {
		mode = "indent",
		indent = -1,
		preserveWhitespace = false,
		lang = undefined,
		charset = undefined,
	} = opts;

	const inPtr = WBXML._malloc(wbxml.length);
	WBXML.HEAPU8.set(wbxml, inPtr);

	const outPtrPtr = WBXML._malloc(4);
	const outLenPtr = WBXML._malloc(4);

	const modeToNumber = {
		compact: 0,
		indent: 1,
		canonical: 2,
	};

	if (!(mode in modeToNumber))
		throw new Error(`Unknown mode: ${mode}`);

	const rc = _wbxml2xml(
		inPtr,
		wbxml.length,
		outPtrPtr,
		outLenPtr,
		modeToNumber[mode],
		indent,
		preserveWhitespace ? 1 : 0,
		lang,
		charset
	);

	const outPtr = WBXML.HEAPU32[outPtrPtr >> 2] >>> 0;
	const outLen = WBXML.HEAPU32[outLenPtr >> 2] >>> 0;
	const result = Buffer.from(WBXML.HEAPU8.slice(outPtr, outPtr + outLen));

	WBXML._free(inPtr);
	WBXML._free(outPtrPtr);
	WBXML._free(outLenPtr);
	WBXML._free(outPtr);

	if (rc !== 0)
		throw new Error(result.toString());

	return result.toString();
}
