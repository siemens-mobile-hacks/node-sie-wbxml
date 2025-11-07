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
