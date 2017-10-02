// node 8.5
// nodemon -w ./ -D -e js -x 'node adminCh'

const util = require('util')
const fs = require('fs')
const writeAsync = util.promisify(fs.writeFile)
const cachios = require('cachios')
const cheerio = require('cheerio')
const _ = require('lodash')

const searchUrl = `https://www.admin.ch/opc/search/?text=SR+822.111&source_lang=de&language%5B%5D=de&product%5B%5D=ClassifiedCompilation&lang=de`
const save = srNumber => {
  const id = _.uniqueId(srNumber)
  return data => {
    writeAsync(`./data/${id}.html`, data, 'utf-8')
      .catch(console.error)
    return data // proxy thru
  }
}

//TODO change me
const sr = `SR+822.111`

const cheerioLoad = text => cheerio.load(text, { decodeEntities: false })

cachios
  .get(searchUrl)
  .then(({ data }) => data)
  .then(save(sr))
  .then(cheerio.load)
  // TODO grab tags also
  .then($ => $('div.results a').attr('href')) // first link
  // https://www.admin.ch/opc/de/classified-compilation/20002241/index.html
  .then(url => cachios.get(url))
  .then(({ data }) => data)
  .then(save(sr))
  .then(cheerioLoad)
  .then($ => ({
    isInForce: $('div.soft-green>div').html() === 'Dieser Text ist in Kraft.',
    sr: $('h1').eq(2).html(),
    title: $('h1').eq(3).html(),
    //Verordnung des WBF über gefährliche und beschwerliche Arbeiten bei Schwangerschaft und Mutterschaft
    //Regulation of the WBF on dangerous and arduous work during pregnancy and maternity
  }))
  .then(console.log)
  .catch(console.error)


// TODO https://www.admin.ch/opc/search/?text=SR+822.111&source_lang=de&language%5B%5D=de&product%5B%5D=ClassifiedCompilation&lang=de
const tags = `
<div id="tags" style="display:none">
  <ul>
  <li><a href='#' >SR 822.111</a></li>`