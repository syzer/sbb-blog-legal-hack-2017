const _ = require('lodash')

// here he skips <dt> between <p/>
const extractParagraphs = ($, p) => $('p')
  .map((i, el) =>
    $(el).text()
  ).get()

const whenAreNoSections = $ =>
  $('#lawcontent h5')
    .map((i, e) => ({
      articleName: $(e).text().trim(),
      articleContents: extractParagraphs($, e)
    })).get()

const extractArticles = ($, s) => $(s).next()
  .map((i, e) =>
    $(e).find('h5')
      .map((i, e) => ({
        articleName: $(e).text().trim(),
        articleContents: extractParagraphs($, e)
      })).get()
  ).get()

const whenThereAreH1 = $ =>
  $('#lawcontent h1.title').eq(0).next().eq(0).find('h2')
    .map((i, e) => ({
      sectionName: $(e).text().trim(),
      sectionContents: extractArticles($, e)
    })).get()


const whenThereAreSections = $ =>
  $('#lawcontent h2')
    .map((i, s) => ({
      sectionName: $(s).text().trim(),
      sectionContents: extractArticles($, s)
    })).get()

module.exports = {
  parse: (chapters, $) => {
    if (!_.isEmpty($('#lawcontent h1.title'))) {
      return whenThereAreH1($)
    }
    return _.isEmpty(chapters)
      ? whenAreNoSections($)
      : whenThereAreSections($)
  }
}