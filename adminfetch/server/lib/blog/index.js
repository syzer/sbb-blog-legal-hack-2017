
var feedparser = require('feedparser-promised');

var items = [];
var blogParser = function(url) {
    return feedparser
        .parse(url)
        .catch(function (error) {
            console.error('error: ', error);
        });
}



module.exports = {
    "parse" : blogParser
}

