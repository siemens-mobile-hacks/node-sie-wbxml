[![NPM Version](https://img.shields.io/npm/v/%40sie-js%2Fwbxml)](https://www.npmjs.com/package/@sie-js/wbxml)

# USAGE
```typescript
import { xml2wbxml, wbxml2xml } from '@sie-js/wbxml';

const xml = `<?xml version="1.0"?>
<!DOCTYPE CHARACTERISTIC-LIST SYSTEM "characteristic-list.dtd">
<CHARACTERISTIC-LIST>
    <CHARACTERISTIC TYPE="ADDRESS">
        <PARM NAME="BEARER" VALUE="GSM/CSD"/>
        <PARM NAME="PROXY" VALUE="123.34.6.7"/>
        <PARM NAME="CSD_DIALSTRING" VALUE="+45"/>
        <PARM NAME="PPP_AUTHTYPE" VALUE="PAP"/>
    </CHARACTERISTIC>
    <CHARACTERISTIC TYPE="URL" VALUE="http://wap.dk"/>
    <CHARACTERISTIC TYPE="NAME">
        <PARM NAME="NAME" VALUE="ABC"/>
    </CHARACTERISTIC>
    <CHARACTERISTIC TYPE="BOOKMARK">
        <PARM NAME="NAME" VALUE="Wap"/>
        <PARM NAME="URL" VALUE="http://wap.dk"/>
    </CHARACTERISTIC>    
</CHARACTERISTIC-LIST>`;

const wbxml = xml2wbxml(xml, { version: "1.3" });
console.log(wbxml);
console.log(wbxml2xml(out, { lang: "OTA" }));
```

# CREDITS
[libwbxml](https://github.com/libwbxml/libwbxml)

# AI-assisted contributions

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
