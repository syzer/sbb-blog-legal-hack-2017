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
    // Verordnung des WBF über gefährliche und beschwerliche Arbeiten bei Schwangerschaft und Mutterschaft
    // Regulation of the WBF on dangerous and arduous work during pregnancy and maternity
  }))
  .then(console.log)
  .catch(console.error)


// TODO https://www.admin.ch/opc/search/?text=SR+822.111&source_lang=de&language%5B%5D=de&product%5B%5D=ClassifiedCompilation&lang=de
const tags = `
<div id="tags" style="display:none">
  <ul>
  <li><a href='#' >SR 822.111</a></li>`

// TODO extract this
// Beschluss	20. März 2001
// Inkrafttreten	1. April 2001
// Quelle	AS 2001 935
// Chronologie	Chronologie
// Änderungen	Änderungen


// decision	20 March 2001
// Come into effect	1 April 2001
// source	AS 2001 935
// chronology	chronology
// amendments	amendments


// Ex:
//   https://www.admin.ch/opc/de/classified-compilation/20002241/index.html
//   HR defined its important
// 1. who applies
// 2. scope of the law

// ex:
// Pregnant women may not be employed in workplaces with a sound pressure level of ≥ 85 dB (A) (L EX 8 hrs). Infringements of infra- or ultrasound shall be assessed separately.
// limits sound

// ex (court decision)
// decibels leavel measuringm changes how building would be build

