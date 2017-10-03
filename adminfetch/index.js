const _ = require('lodash')
const config = require('./config/parameter')

const fetch = (lastModified) => {
  if (!lastModified) {
    lastModified = new Date()
  }

  return require('./server/lib/blog/index')
    .parse(config.admin_ch_url)
    .then(function (anouncements) {
      const items = anouncements

      return anouncements
        .filter((anouncement) =>
          Date.parse(anouncement.pubDate) > lastModified)
        .sort((a, b) =>
          Date.parse(a.pubDate) < Date.parse(b.pubDate))
        .map((anouncement, index) =>
          require('./server/lib/html/index')
            .get(anouncement.link)
            .then(({ data }) => data)
            .then(require('cheerio').load)
            .then($ =>
              $('#content table tr:not(:first-child)')
                .map((i, e) => $(e)
                  .find('td.nowrap')
                  .eq(1).text().trim()).get())
            .then((srs) => {
              const validSrs = srs.filter(e => !_.isEmpty(e))
              // console.log(validSrs)
              return 'aaa'
            }))
    })
}

module.exports = fetch
