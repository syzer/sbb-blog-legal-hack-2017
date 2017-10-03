var fetch = require('./index.js');

// initially get all:
var lastModified = new Date(1970, 1, 1);


fetch(lastModified)
    .then(function (newLastModified) {
        lastModified = newLastModified;
        console.log("done", lastModified)
    });