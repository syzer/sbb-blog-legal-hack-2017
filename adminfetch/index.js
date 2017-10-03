var config = require('./config/parameter')

var result = [];

var _handleAnouncements = function(anoucements)
{
    return anoucements.map(_handleStatement);
}
var _handleStatementColumns = function(columns){

    columns.parsedata = columns.map(function(c){
        return c;
    });
    return columns;
}

var _handleStatement = function(statement)
{
    statement.as = require('./server/lib/html/index')
        .get(statement.link)
        .then(function(result){ return result.data })
        .then(require('cheerio').load)
        .find(function($) { return $('#content table tr:not(:first-child)')})
        .then(_handleStatementColumns)
}



require('./server/lib/blog/index')
    .parse(config.admin_ch_url)
    .then(_handleAnouncements);

