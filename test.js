const { JSONWrapper } = require('./lib/Index');
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