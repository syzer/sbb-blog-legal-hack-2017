var get = function(url) {
    return require('cachios')
        .get(url);
};

module.exports = {
    "get" : get
}

