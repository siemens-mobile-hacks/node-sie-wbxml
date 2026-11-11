import { describe, expect, it } from 'vitest';
import { wbxml2xml, xml2wbxml, WBXMLOptionError } from './index.js';

// Expected bytes and documents are produced by the native libwbxml tools.
const WML_XML = '<?xml version="1.0"?><!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">' +
	'<wml><card id="main" title="Hello"><p>Привет, мир</p><p>Привет, мир</p></card></wml>';
const WML_WBXML = Buffer.from('030a6a15d09fd180d0b8d0b2d0b5d1822c20d0bcd0b8d180007fe755036d61696e00360348656c6c6f000160830001608300010101', 'hex');
const WML_WBXML_NO_STRTBL = Buffer.from('030a6a007fe755036d61696e00360348656c6c6f00016003d09fd180d0b8d0b2d0b5d1822c20d0bcd0b8d18000016003d09fd180d0b8d0b2d0b5d1822c20d0bcd0b8d18000010101', 'hex');
const WML_INDENT_2 = `<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="main" title="Hello">
    <p>Привет, мир</p>
    <p>Привет, мир</p>
  </card>
</wml>
`;

// OTA documents have no public ID, so the language must be forced
const OTA_WBXML = Buffer.from('03016a0045c67f0187151103d09fd180d0b8d0b2d0b5d18200010101', 'hex');
const OTA_COMPACT = '<?xml version="1.0"?><!DOCTYPE CHARACTERISTIC-LIST SYSTEM "characteristic-list.dtd"><CHARACTERISTIC-LIST>' +
	'<CHARACTERISTIC TYPE="BOOKMARK"><PARM NAME="NAME" VALUE="Привет"/></CHARACTERISTIC></CHARACTERISTIC-LIST>';

// WML document in ISO-8859-5 and the same document without a declared charset
const ISO_8859_5_WBXML = Buffer.from('030a08007f676003bfe0d8d2d5e200010101', 'hex');
const NO_CHARSET_WBXML = Buffer.from('030a00007f676003bfe0d8d2d5e200010101', 'hex');
const PRIVET_COMPACT = '<?xml version="1.0"?><!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">' +
	'<wml><card><p>Привет</p></card></wml>';

const WML_PROLOG = '<?xml version="1.0"?><!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">';

describe('xml2wbxml', () => {
	it('encodes like libwbxml', () => {
		expect(xml2wbxml(WML_XML)).toEqual(WML_WBXML);
	});

	it('disables the string table', () => {
		expect(xml2wbxml(WML_XML, { noStringTable: true })).toEqual(WML_WBXML_NO_STRTBL);
	});

	it('produces an anonymous document', () => {
		// Only documents without a binary public ID carry it in the string table
		const xml = '<?xml version="1.0"?><!DOCTYPE WV-CSP-Message PUBLIC "-//OMA//DTD WV-CSP 1.2//EN" "http://www.openmobilealliance.org/DTD/WV-CSP.DTD">' +
			'<WV-CSP-Message xmlns="http://www.wireless-village.org/CSP1.1"><Session><SessionDescriptor><SessionType>Outband</SessionType></SessionDescriptor></Session></WV-CSP-Message>';
		expect(xml2wbxml(xml, { noPublicId: true })).toEqual(Buffer.from('03016a00496d6e70801901010101', 'hex'));
	});

	it('sets the WBXML version', () => {
		expect(xml2wbxml(WML_XML, { version: '1.1' })[0]).toBe(0x01);
	});

	it('rejects an unsupported version', () => {
		// libwbxml would silently encode it as an unknown version
		expect(() => xml2wbxml(WML_XML, { version: '2.0' as never })).toThrow(WBXMLOptionError);
	});

	it('reports conversion errors', () => {
		expect(() => xml2wbxml('<bad')).toThrow('Parsing of XML Document Failed');
	});

	it('handles many siblings', () => {
		// Overflowed the stack and took O(n^2) time before patches/libwbxml-large-documents.patch
		const xml = `${WML_PROLOG}<wml><card>${Array.from({ length: 50000 }, (_, i) => `<p>${i}</p>`).join('')}</card></wml>`;
		expect(wbxml2xml(xml2wbxml(xml, { noStringTable: true }), { mode: 'compact' })).toBe(xml);
	});

	it('handles deep nesting', () => {
		// Corrupted memory with the default 64 KiB wasm stack
		const xml = `${WML_PROLOG}<wml><card>${'<p>'.repeat(3000)}x${'</p>'.repeat(3000)}</card></wml>`;
		expect(wbxml2xml(xml2wbxml(xml, { noStringTable: true }), { mode: 'compact' })).toBe(xml);
	});
});

describe('wbxml2xml', () => {
	it('decodes like libwbxml', () => {
		expect(wbxml2xml(WML_WBXML, { indent: 2 })).toBe(WML_INDENT_2);
	});

	it('forces the language and sets the generation mode', () => {
		expect(wbxml2xml(OTA_WBXML, { lang: 'OTA', mode: 'compact' })).toBe(OTA_COMPACT);
	});

	it('converts strings from the document charset', () => {
		// libwbxml never enabled iconv before patches/libwbxml-iconv.patch
		expect(wbxml2xml(ISO_8859_5_WBXML, { mode: 'compact' })).toBe(PRIVET_COMPACT);
	});

	it('uses the given charset for documents that do not declare one', () => {
		expect(wbxml2xml(NO_CHARSET_WBXML, { mode: 'compact', charset: 'ISO-8859-5' })).toBe(PRIVET_COMPACT);
	});

	it('reports conversion errors', () => {
		expect(() => wbxml2xml(OTA_WBXML)).toThrow('Unknown Public ID');
	});

	it('rejects unsupported option values', () => {
		// libwbxml would silently ignore unknown names and truncate the indent to a byte
		expect(() => wbxml2xml(WML_WBXML, { mode: 'fast' as never })).toThrow(WBXMLOptionError);
		expect(() => wbxml2xml(WML_WBXML, { lang: 'ota' as never })).toThrow(WBXMLOptionError);
		expect(() => wbxml2xml(WML_WBXML, { charset: 'KOI8-R' as never })).toThrow(WBXMLOptionError);
		expect(() => wbxml2xml(WML_WBXML, { indent: 128 })).toThrow(WBXMLOptionError);
		expect(() => wbxml2xml(WML_WBXML, { indent: 1.5 })).toThrow(WBXMLOptionError);
	});
});
