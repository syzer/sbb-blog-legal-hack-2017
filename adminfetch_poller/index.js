const fetch = require('../adminfetch')

// initially get all:
let lastModified = new Date(1970, 1, 1)

setInterval(() => {
  fetch(lastModified)
    .then((newLastModified) => {
      lastModified = newLastModified;
      console.log('done', lastModified)
    })
}, 5 * 1000)

