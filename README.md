# JSONDB

A simple wrapper around JSON to implement a persistent psuedo-database.

## Information

### What does this module do, and how does it work?
This module is a wrapper around JSON which makes it easier to work with. This database is `persistent`, meaning that even after a Node.js process is closed, the data is not lost. This is a _local_ database, meaning it will be in your codebase and ready to view at any time. It is also portable, meaning if you copy this folder to a new directory, the data will still be read in the same way. 

### USAGE:
```js
const { JSONWrapper } = require('jsondb');
const database = new JSONWrapper({
    file: 'db',
    verbose: true,
    indents: 4
}).pool;

// Get/Set without paths
database.set('a', 3);
console.log(database.get('a')); // 3

// Get/Set with paths
database.set('a', { b: 4 });
console.log(database.get('a')); // { b: 4 }
console.log(database.get('a', 'b')); // 4
database.set('a', 5, 'b');
console.log(database.get('a', 'b')); // 5
```