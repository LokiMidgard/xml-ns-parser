# xml-ns-parser
A parser for xml that creates a JSON struct which retains all information including attributes and namespaces

# structure

Every xml element will be transformed in a JSON object that contains the properties `children`, `attributes`, `name` and `scope`.

- `children`  
  is an array of the child elements
- `attributes`  
  contains the attributes. Its a attribute-name value map.
- `name`  
  has a `local` and a `namespace` property. Where `local` contains the local name of the element and `namespace` the namespace
- `scope`  
  contains the mapping of prefixes in xml to actual namespace. Together with the `getTagName()` function it can resolve prefixes to actuall namespaces.
  
# samlpe

The xml 
```xml
<test foo='bar' />
```

will translate to the JSON
```json
{
 "children": [],
 "attributes": {
   "foo": "bar"
 },
 "name": {
  "local": "test",
  "namespace": ""
 },
 "scope": {
  "": ""
 }
}
```

Notice since the xml did not defined any namespaces the coressponding namespace fileds contain the an empty string.

Or a more complex samlpe that utilise namespaces

```xml
<Persons xmlns='https://person.org' xmlns:address='https://address.org' xmlns:age='https://age.org'>
    <Person name='Mike' age='20'>
        <Frind>Paul</Frind>
        <Frind>Sebastian</Frind>
    </Person>
    <Person name='Paul' age='22'>
        <Frind>Mike</Frind>
        <address:street>Main Street 3</address:street>
    </Person>
</Persons>
```
```json
{
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
}
```


