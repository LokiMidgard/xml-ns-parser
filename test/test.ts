import * as m from './../src/index.js'


import * as mocha from 'mocha';
import * as chai from 'chai';
import chaiLike from 'chai-like'
// console.log(JSON.stringify(m.parseXml(`

// `), undefined, ' '));
// console.log(JSON.stringify( m.parseXml('<test foo="bar" ></test>'), undefined, ' '));

chai.use(chaiLike);


const expect = chai.expect;
describe('Parse', () => {

    it('should be able to parse namespaces correctly', () => {
        const parsed = m.parseXml(`<Persons xmlns='https://person.org' xmlns:address='https://address.org' xmlns:age='https://age.org'>
        <Person name='Mike' age='20'>
            <Frind>Paul</Frind>
            <Frind>Sebastian</Frind>
        </Person>
        <Person name='Paul' age='22'>
            <Frind>Mike</Frind>
            <address:street>Main Street 3</address:street>
        </Person>
    </Persons>`);
        const expected = {
            "children": [
                {
                    "children": [
                        {
                            "children": [],
                            "text": "Paul",
                            "attributes": {},
                            "name": {
                                "local": "Frind",
                                "namespace": "https://person.org"
                            },
                            "scope": {
                                "": "https://person.org",
                                "address": "https://address.org",
                                "age": "https://age.org"
                            }
                        },
                        {
                            "children": [],
                            "text": "Sebastian",
                            "attributes": {},
                            "name": {
                                "local": "Frind",
                                "namespace": "https://person.org"
                            },
                            "scope": {
                                "": "https://person.org",
                                "address": "https://address.org",
                                "age": "https://age.org"
                            }
                        }
                    ],
                    "attributes": {
                        "name": "Mike",
                        "age": "20"
                    },
                    "name": {
                        "local": "Person",
                        "namespace": "https://person.org"
                    },
                    "scope": {
                        "": "https://person.org",
                        "address": "https://address.org",
                        "age": "https://age.org"
                    }
                },
                {
                    "children": [
                        {
                            "children": [],
                            "text": "Mike",
                            "attributes": {},
                            "name": {
                                "local": "Frind",
                                "namespace": "https://person.org"
                            },
                            "scope": {
                                "": "https://person.org",
                                "address": "https://address.org",
                                "age": "https://age.org"
                            }
                        },
                        {
                            "children": [],
                            "text": "Main Street 3",
                            "attributes": {},
                            "name": {
                                "local": "street",
                                "namespace": "https://address.org"
                            },
                            "scope": {
                                "": "https://person.org",
                                "address": "https://address.org",
                                "age": "https://age.org"
                            }
                        }
                    ],
                    "attributes": {
                        "name": "Paul",
                        "age": "22"
                    },
                    "name": {
                        "local": "Person",
                        "namespace": "https://person.org"
                    },
                    "scope": {
                        "": "https://person.org",
                        "address": "https://address.org",
                        "age": "https://age.org"
                    }
                }
            ],
            "attributes": {},
            "name": {
                "local": "Persons",
                "namespace": "https://person.org"
            },
            "scope": {
                "": "https://person.org",
                "address": "https://address.org",
                "age": "https://age.org"
            }
        };

        expect(parsed).like(expected);
    });

    it('should be able to parse without namespaces correctly', () => {
        const parsed = m.parseXml(`<Test foo='bar'/>`);
        const expected = {
            "children": [],
            "attributes": { 'foo': 'bar' },
            "name": {
                "local": "Test",
                "namespace": ""
            },
            "scope": {
                "": "",
            }
        };

        expect(parsed).like(expected);
    });

});