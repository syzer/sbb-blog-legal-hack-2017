const fetch = require('./index.js')

// initially get all:
let lastModified = new Date(1970, 1, 1)

fetch(lastModified)
  .then((newLastModified) => {
    lastModified = newLastModified;
    console.log('done', lastModified)
  });
