#include <stdbool.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <wbxml/wbxml.h>
#include <emscripten/emscripten.h>

static WBXMLLanguage get_lang_from_string(const char *lang) {
	if (strcasecmp(lang, "WML10") == 0)
		return WBXML_LANG_WML10;
	if (strcasecmp(lang, "WML11") == 0)
		return WBXML_LANG_WML11;
	if (strcasecmp(lang, "WML12") == 0)
		return WBXML_LANG_WML12;
	if (strcasecmp(lang, "WML13") == 0)
		return WBXML_LANG_WML13;

	if (strcasecmp(lang, "WTA10") == 0)
		return WBXML_LANG_WTA10;
	if (strcasecmp(lang, "WTAWML12") == 0)
		return WBXML_LANG_WTAWML12;
	if (strcasecmp(lang, "CHANNEL11") == 0)
		return WBXML_LANG_CHANNEL11;
	if (strcasecmp(lang, "CHANNEL12") == 0)
		return WBXML_LANG_CHANNEL12;

	if (strcasecmp(lang, "SI10") == 0)
		return WBXML_LANG_SI10;

	if (strcasecmp(lang, "SL10") == 0)
		return WBXML_LANG_SL10;

	if (strcasecmp(lang, "CO10") == 0)
		return WBXML_LANG_CO10;

	if (strcasecmp(lang, "PROV10") == 0)
		return WBXML_LANG_PROV10;

	if (strcasecmp(lang, "EMN10") == 0)
		return WBXML_LANG_EMN10;

	if (strcasecmp(lang, "DRMREL10") == 0)
		return WBXML_LANG_DRMREL10;

	if (strcasecmp(lang, "OTA") == 0)
		return WBXML_LANG_OTA_SETTINGS;

	if (strcasecmp(lang, "SYNCML10") == 0)
		return WBXML_LANG_SYNCML_SYNCML10;
	if (strcasecmp(lang, "DEVINF10") == 0)
		return WBXML_LANG_SYNCML_DEVINF10;
	if (strcasecmp(lang, "SYNCML11") == 0)
		return WBXML_LANG_SYNCML_SYNCML11;
	if (strcasecmp(lang, "DEVINF11") == 0)
		return WBXML_LANG_SYNCML_DEVINF11;
	if (strcasecmp(lang, "METINF11") == 0)
		return WBXML_LANG_SYNCML_METINF11;
	if (strcasecmp(lang, "SYNCML12") == 0)
		return WBXML_LANG_SYNCML_SYNCML12;
	if (strcasecmp(lang, "DEVINF12") == 0)
		return WBXML_LANG_SYNCML_DEVINF12;
	if (strcasecmp(lang, "METINF12") == 0)
		return WBXML_LANG_SYNCML_METINF12;
	if (strcasecmp(lang, "DMDDF12") == 0)
		return WBXML_LANG_SYNCML_DMDDF12;

	if (strcasecmp(lang, "CSP11") == 0)
		return WBXML_LANG_WV_CSP11;
	if (strcasecmp(lang, "CSP12") == 0)
		return WBXML_LANG_WV_CSP12;

	if (strcasecmp(lang, "AIRSYNC") == 0)
		return WBXML_LANG_AIRSYNC;
	if (strcasecmp(lang, "ACTIVESYNC") == 0)
		return WBXML_LANG_ACTIVESYNC;

	if (strcasecmp(lang, "CONML") == 0)
		return WBXML_LANG_CONML;

	return WBXML_LANG_UNKNOWN;
}

static WBXMLCharsetMIBEnum get_charset_from_string(const char *charset) {
	/* The good old ASCII */
	if (strcasecmp(charset, "ASCII") == 0)
		return WBXML_CHARSET_US_ASCII;

	/* ISO-8859 character sets */
	if (strcasecmp(charset, "ISO-8859-1") == 0)
		return WBXML_CHARSET_ISO_8859_1;
	if (strcasecmp(charset, "ISO-8859-2") == 0)
		return WBXML_CHARSET_ISO_8859_2;
	if (strcasecmp(charset, "ISO-8859-3") == 0)
		return WBXML_CHARSET_ISO_8859_3;
	if (strcasecmp(charset, "ISO-8859-4") == 0)
		return WBXML_CHARSET_ISO_8859_4;
	if (strcasecmp(charset, "ISO-8859-5") == 0)
		return WBXML_CHARSET_ISO_8859_5;
	if (strcasecmp(charset, "ISO-8859-6") == 0)
		return WBXML_CHARSET_ISO_8859_6;
	if (strcasecmp(charset, "ISO-8859-7") == 0)
		return WBXML_CHARSET_ISO_8859_7;
	if (strcasecmp(charset, "ISO-8859-8") == 0)
		return WBXML_CHARSET_ISO_8859_8;
	if (strcasecmp(charset, "ISO-8859-9") == 0)
		return WBXML_CHARSET_ISO_8859_9;
	if (strcasecmp(charset, "ISO-10646-UCS-2") == 0)
		return WBXML_CHARSET_ISO_10646_UCS_2;

	/* Chinese character set */
	if (strcasecmp(charset, "SHIFT_JIS") == 0)
		return WBXML_CHARSET_SHIFT_JIS;

	/* Japanese character set */
	if (strcasecmp(charset, "BIG5") == 0)
		return WBXML_CHARSET_BIG5;

	/* Unicode character sets */
	if (strcasecmp(charset, "UTF-8") == 0)
		return WBXML_CHARSET_UTF_8;
	if (strcasecmp(charset, "UTF-16") == 0)
		return WBXML_CHARSET_UTF_16;

	return WBXML_CHARSET_UNKNOWN;
}

static WBXMLVersion get_version_from_string(const char *v) {
	if (strcmp(v, "1.0") == 0)
		return WBXML_VERSION_10;
	if (strcmp(v, "1.1") == 0)
		return WBXML_VERSION_11;
	if (strcmp(v, "1.2") == 0)
		return WBXML_VERSION_12;
	if (strcmp(v, "1.3") == 0)
		return WBXML_VERSION_13;
	return WBXML_VERSION_UNKNOWN;
}

static int error_report(uint8_t **out, uint32_t *out_len, const char *msg) {
	*out = (uint8_t *) strdup(msg);
	*out_len = strlen(msg);
	return -1;
}

EMSCRIPTEN_KEEPALIVE
int xml2wbxml(
	uint8_t *xml_in,
	uint32_t xml_in_len,
	uint8_t **out,
	uint32_t *out_len,
	const char *wbxml_version,
	bool preserve_whitespace,
	bool no_string_table,
	bool no_public_id
) {
	WBXMLConvXML2WBXML *converter = NULL;
	WBXMLError err = wbxml_conv_xml2wbxml_create(&converter);
	if (err != WBXML_OK)
		return error_report(out, out_len, (const char *) wbxml_errors_string(err));

	if (wbxml_version)
		wbxml_conv_xml2wbxml_set_version(converter, get_version_from_string(wbxml_version));
	if (no_string_table)
		wbxml_conv_xml2wbxml_disable_string_table(converter);
	if (preserve_whitespace)
		wbxml_conv_xml2wbxml_enable_preserve_whitespaces(converter);
	if (no_public_id)
		wbxml_conv_xml2wbxml_disable_public_id(converter);

	err = wbxml_conv_xml2wbxml_run(
		converter,
		xml_in,
		xml_in_len,
		out,
		out_len
	);
	wbxml_conv_xml2wbxml_destroy(converter);

	if (err != WBXML_OK) {
		if (*out)
			free(*out);
		return error_report(out, out_len, (const char *) wbxml_errors_string(err));
	}

	return 0;
}

EMSCRIPTEN_KEEPALIVE
int wbxml2xml(
	uint8_t *wbxml_in,
	uint32_t wbxml_in_len,
	uint8_t **out,
	uint32_t *out_len,
	WBXMLGenXMLType gen_type,
	int indent,
	bool preserve_whitespace,
	const char *force_lang,
	const char *force_charset
) {
	WBXMLConvWBXML2XML *conv = NULL;
	WBXMLError err = wbxml_conv_wbxml2xml_create(&conv);
	if (err != WBXML_OK)
		return error_report(out, out_len, (const char *) wbxml_errors_string(err));

	wbxml_conv_wbxml2xml_set_gen_type(conv, gen_type);

	if (indent >= 0)
		wbxml_conv_wbxml2xml_set_indent(conv, indent);

	if (preserve_whitespace)
		wbxml_conv_wbxml2xml_enable_preserve_whitespaces(conv);

	if (force_lang && strlen(force_lang) > 0)
		wbxml_conv_wbxml2xml_set_language(conv, get_lang_from_string(force_lang));

	if (force_charset && strlen(force_charset) > 0)
		wbxml_conv_wbxml2xml_set_charset(conv, get_charset_from_string(force_charset));

	err = wbxml_conv_wbxml2xml_run(conv,
		wbxml_in,
		wbxml_in_len,
		out,
		out_len
	);
	wbxml_conv_wbxml2xml_destroy(conv);

	if (err != WBXML_OK)
		return error_report(out, out_len, (const char *) wbxml_errors_string(err));

	return 0;
}
