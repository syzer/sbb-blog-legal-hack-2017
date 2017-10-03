var config = require('./config/parameter')

var result = [];

var _handleStatementColumns = function(index, column){

    console.log(column.find('td'));

    return column;
}


var fetch = function(lastModified)
{
    if (lastModified == null) lastModified = new Date();

    var items = [];
    return require('./server/lib/blog/index')
        .parse(config.admin_ch_url)
        .then(function(anouncements)
        {
            items = anouncements;

            var latest =  anouncements
                .filter(function(anouncement)
                {
                    return Date.parse(anouncement.pubDate) > lastModified;
                })
                .sort(function(a,b)
                {
                    return Date.parse(a.pubDate) < Date.parse(b.pubDate);
                })
                /*
                .map(function(anouncement){

                     return anouncement.pubDate;

                });
                */

                //console.log(latest);

                .forEach(function(anouncement,index)
                {
                    return require('./server/lib/html/index')
                        .get(anouncement.link)
                        .then(function(result){ return result.data })
                        .then(require('cheerio').load)
                        .then(function($) {
                                var data = $('#content table tr:not(:first-child)')
                                    .each(function (i, statement) {
                                        return $(this).find('td').text();
                                    });
                                console.log(data);
                                return data;
                            }
                        )
                        .then(function(result){
                            //console.log(result);
                        })
                });

                var l = latest.shift();

                if (l) {
                    return Date.parse(l.pubDate);

                } else {
                    return lastModified;
                }

        });

}

module.exports = fetch;

/**
 {
    "title" : "Verordnung über Massnahmen gegenüber Syrien"
    "as" : {
        "identifier" : "AS 2017 5139",
        "type" : "AS",
        "url"
    },
    "sr" : {
        "identifier" : "946.231.172.7"
    }

}*/
