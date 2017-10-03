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
                                return $('#content table tr:not(:first-child)')
                                    .each(function(i,statement){
                                        return $(this).find('td').each(function(i,col)
                                        {
                                            if (i == 0) return { link : $(this).text() };
                                            else return col;
                                        })
                                    });
                            }
                        )
                        .then(function(statement){

                        });

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
