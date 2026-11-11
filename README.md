# @sie-js/wbxml

[![NPM Version](https://img.shields.io/npm/v/%40sie-js%2Fwbxml)](https://www.npmjs.com/package/@sie-js/wbxml)

Converts between WBXML and XML. It is [libwbxml](https://github.com/libwbxml/libwbxml) built for WebAssembly, so it needs Node.js 20 or newer and nothing else.

## Command line

```bash
npm install -g @sie-js/wbxml
```

This installs `wbxml2xml` and `xml2wbxml`. They accept the same options as the libwbxml tools of the same name. There is also `wbxml`, which runs both as subcommands (`wbxml decode`, `wbxml encode`) and works with `npx @sie-js/wbxml` without installing.

```bash
xml2wbxml -o settings.wbxml settings.xml
wbxml2xml -l OTA -i 4 settings.wbxml
wbxml2xml -m compact < si.wbxml > si.xml
```

Without an input file, or with `-`, the input is read from stdin. Without `-o`, the result goes to stdout. `xml2wbxml` will not write binary data to a terminal unless you pass `-o -`.

### wbxml2xml

| Option                    | Meaning                                                                   |
|---------------------------|---------------------------------------------------------------------------|
| `-o, --output <file>`     | Output file                                                               |
| `-m, --mode <mode>`       | `0` or `compact`, `1` or `indent` (default), `2` or `canonical`           |
| `-i, --indent <n>`        | Indent width for the `indent` mode, default 0                             |
| `-k, --keep-whitespace`   | Keep ignorable whitespace                                                 |
| `-l, --lang <lang>`       | Document language, for documents without a known public ID                |
| `-c, --charset <charset>` | Charset for documents that don't declare one                              |
| `--list-langs`            | Print supported languages                                                 |
| `--list-charsets`         | Print supported charsets                                                  |

Nokia/Ericsson OTA settings and some other formats have no public ID, so they can only be decoded with `-l`, e.g. `-l OTA`.

### xml2wbxml

| Option                      | Meaning                                       |
|-----------------------------|-----------------------------------------------|
| `-o, --output <file>`       | Output file                                   |
| `-v, --wbxml-version <ver>` | `1.0`, `1.1`, `1.2` or `1.3` (default)        |
| `-k, --keep-whitespace`     | Keep ignorable whitespace                     |
| `-n, --no-string-table`     | Don't build a string table                    |
| `-a, --anonymous`           | Don't write the public ID                     |

Building the string table gets very slow on documents with thousands of text nodes; use `-n` for those.

The tools exit with 1 if the conversion or file I/O fails and with 2 if the command line is wrong.

## Library

```typescript
import { xml2wbxml, wbxml2xml } from '@sie-js/wbxml';

const xml = `<?xml version="1.0"?>
<!DOCTYPE CHARACTERISTIC-LIST SYSTEM "characteristic-list.dtd">
<CHARACTERISTIC-LIST>
	<CHARACTERISTIC TYPE="BOOKMARK">
		<PARM NAME="NAME" VALUE="Wap"/>
		<PARM NAME="URL" VALUE="http://wap.dk"/>
	</CHARACTERISTIC>
</CHARACTERISTIC-LIST>`;

const wbxml = xml2wbxml(xml);
console.log(wbxml2xml(wbxml, { lang: 'OTA', indent: 4 }));
```

`xml2wbxml(xml, options)` takes a string or bytes and returns a `Buffer`. A string is encoded as UTF-8; pass bytes if the document uses the encoding from its XML declaration. Options: `version`, `preserveWhitespace`, `noStringTable`, `noPublicId`.

`wbxml2xml(wbxml, options)` returns a string. It decodes documents in any of the supported charsets; `charset` is used for documents that don't declare one. Options: `mode`, `indent`, `preserveWhitespace`, `lang`, `charset`.

Allowed option values are exported as `WBXML_VERSIONS`, `WBXML_GEN_MODES`, `WBXML_LANGS` and `WBXML_CHARSETS`. Any other value throws `WBXMLOptionError`.

## Building

You need [Emscripten](https://emscripten.org/) and pnpm.

```bash
pnpm install
pnpm run build:wasm
pnpm run build
pnpm test
```

`build:wasm` downloads and builds libexpat and libwbxml into `build/`. libwbxml is patched first (see `patches/`): unpatched, it runs out of stack and becomes very slow on documents with many elements, and never uses iconv, so it can't decode documents in charsets other than UTF-8.

## License

LGPL-2.1-or-later, same as libwbxml. Uses [libwbxml](https://github.com/libwbxml/libwbxml) and [libexpat](https://github.com/libexpat/libexpat).

## AI-assisted contributions

We are not against AI. We are against vibe coding, AI slop, and attempts to offload engineering work to a model. This project prioritizes quality, not development speed or results at any cost.

1. **Do not use AI-generated text in human-to-human communication.**

   Write comments, discussions, PR descriptions, and responses to reviewers yourself.

2. **Do not let AI submit PRs or commits.**

   The author must always be a human who has personally reviewed the changes and takes responsibility for them.

4. **Do not submit code primarily designed or written by AI.**

   Architecture, algorithms, code organization, and the final implementation must be decided by a human. AI may only be used as an auxiliary tool.

6. **You must understand all the code you submit.**

   You must be able to explain every change, justify your decisions, and fix any problems yourself. If you do not understand the code, open a feature request instead of a PR.

8. **Code must be simple, clear, and tested.**

   Follow KISS, the project's coding style, and its existing architecture. Do not introduce unnecessary abstractions, dependencies, or untested changes.

AI slop PRs will be closed without review.
