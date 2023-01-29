import { XMLParser } from "fast-xml-parser";

const builtInXsdtypes = [
    //numeric types
    'byte',
    'decimal',
    'int',
    'integer',
    'long',
    'negativeInteger',
    'nonNegativeInteger',
    'nonPositiveInteger',
    'positiveInteger',
    'short',
    'unsignedLong',
    'unsignedInt',
    'unsignedShort',
    'unsignedByte',

    // string types
    'ENTITIES',
    'ENTITY',
    'ID',
    'IDREF',
    'IDREFS',
    'language',
    'Name',
    'NCName',
    'NMTOKEN',
    'NMTOKENS',
    'normalizedString',
    'QName',
    'string',
    'token',

    // date time
    'date',
    'dateTime',
    'duration',
    'gDay',
    'gMonth',
    'gMonthDay',
    'gYear',
    'gYearMonth',
    'time',

    // misc types
    'anyURI',
    'base64Binary',
    'boolean',
    'double',
    'float',
    'hexBinary',
    'NOTATION',
    'QName',
]


export async function parseXml(xmlText: string, entityLookup: (path: string) => Promise<string>): Promise<Xml> {
    const parser = new XMLParser({
        allowBooleanAttributes: true,
        ignoreAttributes: false,
        attributeNamePrefix: '',
        // attributesGroupName: '@',
        ignoreDeclaration: true,
        removeNSPrefix: false,
        // isArray: ()=> true,
        preserveOrder: true
    });

    const entityReg = /<!ENTITY\s+(?<key>[^\s]+)\s+SYSTEM\s+"(?<path>[^"]*)">/gm;

    for (const match of xmlText.matchAll(entityReg)) {
        const key = match.groups?.['key'];
        const path = match.groups?.['path'];
        if (key && path) {
            parser.addEntity(key, await entityLookup(path));
        }
    }


    const data = parser.parse(xmlText);

    const xml = CalculateNS(data[0]);
    return xml;
}

type writeOptions = { pretty: boolean, indent: number, quote: string }

const defaultWriteOptions: writeOptions = {
    pretty: true,
    indent: 2,
    quote: '\''
}

export function writeXml(xml: Xml, options?: Partial<writeOptions>): string {
    options ??= {};
    const effectivOptions = { ...defaultWriteOptions, ...options };

    const text = writeXmlInternal(xml, {}, effectivOptions, 0);
    if (options.pretty) {
        return prettifyXml(text)
    } else {
        return text;
    }
}
function writeXmlInternal(xml: Xml, scope: Scope, options: writeOptions, indent: number): string {


    const addedScope =
        Object.fromEntries(Object.entries(xml.scope).filter(([perfix, ns]) => {
            return scope[perfix] == undefined || scope[perfix] != ns;
        }))
    const newScope = { ...scope, ...addedScope };


    const tagName = xml.name.namespace == newScope['']
        ? xml.name.local
        : `${Object.entries(scope).filter(([prefix, ns]) => xml.name.namespace == ns)[0][0]}:${xml.name.local}`;

    const namespaces = Object.entries(addedScope).map(([perfix, ns]) => perfix == '' ? `xmlns=${options.quote}${ns}${options.quote}` : `xmlns:${perfix}=${options.quote}${ns}${options.quote}`);

    const attributes = Object.entries(xml.attributes).map(([name, value]) => `${name}=${options.quote}${value}${options.quote}`);

    const indentionSting = `${options.pretty ? '\n' : ''}${Array.from({ length: options.pretty ? indent : 0 }, () => ' ').join('')}`;
    const content = xml.text !== undefined
        ? xml.text
        : xml.children.map(c => Array.from({ length: options.pretty ? options.indent : 0 }, () => ' ').join('') + writeXmlInternal(c, newScope, options, indent + options.indent)).join(indentionSting);

    if (content) {
        if (xml.text !== undefined)
            return `<${[tagName, ...namespaces, ...attributes].join(' ')}>${content}</${tagName}>`
        return `<${[tagName, ...namespaces, ...attributes].join(' ')}>${indentionSting}${content}${indentionSting}</${tagName}>`
    } else {
        return `<${tagName} ${namespaces} ${attributes} />`
    }


}

function prettifyXml(sourceXml: string) {
    var xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml');
    var xsltDoc = new DOMParser().parseFromString([
        // describes how we want to modify the XML - indent everything
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:strip-space elements="*"/>',
        '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
        '    <xsl:value-of select="normalize-space(.)"/>',
        '  </xsl:template>',
        '  <xsl:template match="node()|@*">',
        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
        '  </xsl:template>',
        '  <xsl:output indent="yes"/>',
        '</xsl:stylesheet>',
    ].join('\n'), 'application/xml');

    var xsltProcessor = new XSLTProcessor();
    xsltProcessor.importStylesheet(xsltDoc);
    var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
    var resultXml = new XMLSerializer().serializeToString(resultDoc);
    return resultXml;
};

function CalculateNS(obj: any, scope?: Scope) {
    if (!scope) {
        scope = {};
    }

    const filteredKrys = Object.keys(obj).filter(x => x !== ':@' && x !== '#text');
    if (filteredKrys.length == 0) {
        console.log(`no key ${JSON.stringify(obj, undefined, 2)}`);
        return {} as Xml;
    }
    const tagName = filteredKrys[0];
    const newScope = { ...scope };

    obj['children'] = obj[tagName] ?? [];
    delete obj[tagName];
    if (obj['children'].length === 1 && typeof obj['children'][0]['#text'] !== 'undefined') {
        // This is a text entry and not a child
        obj['text'] = obj['children'][0]['#text'];
        obj['children'] = [];
    }

    const text = obj['#text'];
    if (typeof text !== 'undefined') {
        obj['text'] = ['#text'];
        delete obj['#text'];
    }

    if (obj['text'] == undefined) {
        obj['text'] = '';
    } else if (typeof obj['text'] !== 'string') {
        obj['text'] = obj['text'].toString();
    }

    const attributes = obj[':@'];
    if (attributes) {
        if (attributes["xmlns"]) {
            // new default namespace
            newScope[''] = attributes["xmlns"];
        }
        if (typeof newScope[''] === 'undefined') {
            newScope[''] = '';
        }
        const valuesForScope = Object.keys(attributes).filter(x => x.startsWith('xmlns:')).map(key => {
            const ns = attributes[key];
            const prefix = key.substring('xmlns:'.length);
            return { prefix, ns };
        });
        for (const { prefix, ns } of valuesForScope) {
            newScope[prefix] = ns;
        }
        const filterdAttributes = Object.entries(attributes).filter(x => x[0] !== 'xmlns' && !x[0].startsWith('xmlns:')).map(x => { return { name: x[0], value: x[1] }; });
        obj['attributes'] = Object.fromEntries(filterdAttributes.map(x => [x.name, x.value]));
        delete obj[':@'];
    } else {
        obj['attributes'] = {}
    }

    obj['name'] = getTagname(tagName, newScope, false);
    obj['scope'] = newScope;
    for (const child of obj['children']) {
        CalculateNS(child, newScope);
    }

    return obj as Xml;
}


export function getTagname(name: string, scope: Scope, includeDefaultTypes: boolean = true): TagName {


    if (name.indexOf(':') != -1) {
        // we have a prefix
        const collonIndex = name.indexOf(':');
        const prefix = name.substring(0, collonIndex);
        const localName = name.substring(collonIndex + 1);
        if (!scope[prefix]) {
            throw Error(`Prefix ${prefix} unknown on element {tagName}`);
        }
        const ns = scope[prefix];
        return { local: localName, namespace: ns };
    } else if (includeDefaultTypes && Object.keys(builtInXsdtypes).includes(name as any)) {
        return { local: name, namespace: '' };
    } else {
        // we use default prefix
        return { local: name, namespace: (scope ? scope[''] : undefined) ?? '' };
    }

}

type Scope = {
    [prefix: string]: string;
}

export type Xml = {

    children: Xml[],
    attributes: {
        [name: string]: string
    },
    name: TagName,
    scope: Scope,
    text: string,
}
export type TagName = {
    local: string,
    namespace: string
}