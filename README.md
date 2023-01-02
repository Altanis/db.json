# JSONDB

A simple wrapper around JSON to implement a persistent psuedo-database.

## Information

### What does this module do, and how does it work?
This module is a wrapper around JSON which makes it easier to work with. This database is `persistent`, meaning that even after a Node.js process is closed, the data is not lost. This is a _local_ database, meaning it will be in your codebase and ready to view at any time. It is also portable, meaning if you copy this folder to a new directory, the data will still be read in the same way. 

## Usage

### `JSONWrapper`
This is a Class, which takes in an Options object as a parameter when intializing.
```ts
interface Options {
    /** The path to read from or write to. */
    file: string;
    /** Specify whether or not to create backups. Defaults to `false` */
    backup?: boolean;
    /** Specify whether or not to create verbose logs. Defaults to `true`. */
    verbose?: boolean;
    /** Whether or not to defer saves to file. `0` means no delay, default is `0`. */
    defer?: number;
    /** The amount of indents to use when saving to file. Defaults to `0`. */
    indents?: number;
}
```
Upon instantiation, this has a property called `pool`, where all handling of the database occurs. 

### `Pool`

#### `Options.file` determines the file it should write to. It is a mandatory property.
#### `Options.backup` is currently not implemented. In the future, it will store multiple backups of the database locally in the event of data loss. Defaults to `false`.
#### `Options.verbose` logs debug logs. Defaults to `false`.
#### `Options.defer` takes a number (in millisecond format), to save at that specific interval. Default is `0`, meaning it saves after every operation.
#### `Options.indents` takes a number and indents the JSON database by it. Defaults to `0`.

All methods of `Pool` are asynchronous, and return a Promise. Will return `Promise<void>` if `Options.defer` exists.

#### `Pool.get(key, path)` retreives a value from the database.
#### `Pool.find(callback, all?)` retrieves entries given a callback. `all` defaults to `true`, determines if all entries should be given back.
#### `Pool.set(key, value, path)` sets a value to the database.
#### `Pool.forEach(callback)` iterates over each member of a database and runs a callback.
#### `Pool.ensure(key, value, path)` sets a value to the database if the `key` does not have a value already assigned to it.
#### `Pool.has(key, path)` determines whether or not a key exists.
#### `Pool.delete(key)` deletes an entry from the database.
#### `Pool.clear()` deletes the database.
#### `Pool.keys()`, `Pool.values()`, and `Pool.entries()` are identical to their `Array` counterparts.
#### `Pool.observe(key, path, cb)` observes an object for any changes, and executes the callback if a change occurs.
#### `Pool.lock()` makes the database readonly, and `Pool.unlock()` makes it writable.
#### `Pool.import(data)` overwrites a database with incoming data, `Pool.export()` exports the database.

### Example:
```js
const { JSONWrapper } = require('jsdatabase.json');
const database = new JSONWrapper({
    file: 'db',
    verbose: true,
    indents: 4
}).pool;

(async function() {
// Get/Set without paths
await database.set('a', 3);
console.log(await (database.get('a'))); // 3

// Get/Set with paths
await database.set('a', { b: 4 });
console.log(await (database.get('a'))); // { b: 4 }
console.log(await(database.get('a', 'b'))); // 4
await database.set('a', 5, 'b');
console.log(await(database.get('a', 'b'))); // 5
})();
```
