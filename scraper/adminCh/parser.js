const _ = require('lodash')

const whenAreNoSections = $ =>
  $('#lawcontent h5')
    .map((i, e) => ({
      articleName: $(e).text().trim(),
      articleContents: $(e).nextAll().html() // can split by <p> need p.name
    })).get()


const whenThereAreSections = $ =>
  $('#lawcontent h2')
    .map((i, s) => ({
      sectionName: $(s).text().trim(),
      sectionContents: $(s).next()
        .map((i, e) =>
          $(e).find('h5')
            .map((i, e) => ({
                articleName: $(e).text().trim(),
                articleContents: $(e).nextAll().html() // can split by <p> need p.name
              })
            ).get()
        ).get()
    })).get()

module.exports = {
  // then there are no chapters
  parse: (chapters, contents) => _.isEmpty(chapters)
    ? whenAreNoSections(contents)
    : whenThereAreSections(contents)
}