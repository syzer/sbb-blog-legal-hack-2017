// node 8.5
// nodemon -w ./ -D -e js -x 'node adminCh'

const cachios = require('cachios')
const _ = require('lodash')
const { cheerioLoad, save } = require('../lib/index')
const { parse } = require('./parser')
const { dsg, employment } = require('./interestingSr')

// const sr = `822.111` // employment law
// const sr = `742.147.2` // employment law
const sr = `235.1` // DSG law

// const searchUrl = sr =>  `https://www.admin.ch/opc/search/?text=${sr}&lang=de&language%5B%5D=de&product%5B%5D=cc&date_range_min=&date_range_max=&d_compilation=both&d_is_in_force=yes&thesaurus=1`
const searchUrl = sr => `http://www.admin.ch/opc/search/?text=${sr}&lang=de&language%5B%5D=de&product%5B%5D=ClassifiedCompilation`

// Data is structured Chapter => section => article
// We can also extracts tags about documents, from tag cloud
Promise.all([sr].map(sr =>
  cachios
    .get(searchUrl(sr))
    .then(({ data }) => data)
    .then(save(sr))
    .then(cheerioLoad)
    .then($ => ({
      isInForce: $('div.soft-green>div').html() === 'Dieser Text ist in Kraft.',
      sr: $('h1').eq(2).html(), // AKA id
      title: $('h1').eq(3).html(),
      preamble: $('a[name=praeambel]').parent().text(),
      chapters: $('h1.title')
        .map((i, el) => $(el).text()).get()
        .map(s => s.trim()),
      contents: parse(
        $('h1.title').map((i, el) => $(el).text()).get().map(s => s.trim()),
        $
      ),
      fullHtml: $('#lawcontent').html().trim()
    }))
    .then(data => JSON.stringify(data, null, 2))
    .then(save(sr, 'json'))
    .then(console.log)
    .catch(console.error)))
  .then('all Done')
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

