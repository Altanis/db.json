# JSONDB

A simple wrapper around JSON to implement a persistent psuedo-database.

## Information

### What does this module do, and how does it work?
This module is a wrapper around JSON which makes it easier to work with. This database is `persistent`, meaning that even after a Node.js process is closed, the data is not lost. This is a _local_ database, meaning it will be in your codebase and ready to view at any time. It is also portable, meaning if you copy this folder to a new directory, the data will still be read in the same way. 