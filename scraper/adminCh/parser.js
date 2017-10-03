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


const extractSectionsAndArticles = $ =>
  $('#lawcontent h2')
    .map((i, s) => ({
      sectionName: $(s).text().trim(),
      sectionContents: extractArticles($, s)
    })).get()


// '742.147.2',
const whenThereAreH1AndH2AndArticles = $ =>
  $('#lawcontent h1.title').map((i, e) => ({
    chapterName: $(e).text().trim(),
    chapterContents: extractSectionsAndArticles($, e)
  })).get()
    // .next().eq(0).find('h2')
    // .map((i, e) => ({
    //   sectionName: $(e).text().trim(),
    //   sectionContents: extractArticles($, e)
    // })).get()

// 152.1
// https://www.admin.ch/opc/de/classified-compilation/19994756/index.html
const whenThereAreH1AndArticles = $ =>
  $('#lawcontent h1.title').map((i, e) => ({
    sectionName: $(e).text().trim(),
    sectionContents: extractArticles($, e)
  })).get()

module.exports = {
  parse: (chapters, $) => {
    if (!_.isEmpty($('#lawcontent h1').toArray())
        && $('#lawcontent h2').toArray().length < 2 ) {
      return whenThereAreH1AndArticles($)
    }
    if (!_.isEmpty($('#lawcontent h2.title'))) {
      return whenThereAreH1AndH2AndArticles($)
    }
    return _.isEmpty(chapters)
      ? whenAreNoSections($)
      : extractSectionsAndArticles($)
  }
}