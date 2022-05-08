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


export function parseXml(xmlText: string): Xml {
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
    const data = parser.parse(xmlText);

    const xml = CalculateNS(data[0]);
    return xml;
}


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
    const attributes = obj[':@'];
    if (attributes) {
        if (attributes["xmlns"]) {
            // new default namespace
            newScope[''] = attributes["xmlns"];
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
        const namspacedAttributes = filterdAttributes.map(x => {
            const value = x.value;
            if (x.name.includes(':')) {
                const splited = x.name.split(':');
                const namespace = newScope[splited[0]];
                const local = splited[1];
                return { namespace, local, value }
            } else {
                const namespace = newScope[''];
                const local = x;
                return { namespace, local, value }
            }
        });
        const mapedAttributes = Object.fromEntries([...new Set(namspacedAttributes.map(x => x.namespace))].map(x => [x, Object.fromEntries(namspacedAttributes.filter(y => y.namespace === x).map(y => [y.local, y.value]))]));
        obj['attributes'] = mapedAttributes;
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
        return { local: name, namespace: scope[''] ?? '' };
    }

}

type Scope = {
    [prefix: string]: string;
}

export type Xml = {

    children: Xml[],
    attributes: {
        [ns: string]: {
            [name: string]: string
        }
    },
    name: TagName,
    scope: Scope,
    text: undefined | string,
}
export type TagName = {
    local: string,
    namespace: string
}