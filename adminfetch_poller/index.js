var fetch = require('../adminfetch');

// initially get all:
var lastModified = new Date(1970, 1, 1);

setInterval(function () {
    fetch(lastModified)
        .then(function (newLastModified) {
            lastModified = newLastModified;
            console.log("done", lastModified)
        })
}, 5*1000);

