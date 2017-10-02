// node 8.5
// nodemon -w ./ -D -e js -x 'node adminCh'

const util = require('util')
const fs = require('fs')
const writeAsync = util.promisify(fs.writeFile)
const cachios = require('cachios')
const _ = require('lodash')
const { cheerioLoad, save } = require('./lib')

// const sr = `822.111` // employment law
const sr = `235.11` // DSG law

// const searchUrl = `https://www.admin.ch/opc/search/?text=SR+822.111&source_lang=de&language%5B%5D=de&product%5B%5D=ClassifiedCompilation&lang=de`
const searchUrl = `https://www.admin.ch/opc/search/?text=${sr}&lang=de&language%5B%5D=de&product%5B%5D=cc&date_range_min=&date_range_max=&d_compilation=both&d_is_in_force=yes&thesaurus=1`

// https://www.admin.ch/opc/de/classified-compilation/19930159/index.html
// https://www.admin.ch/opc/de/classified-compilation/20002241/index.html

// Verordnung des WBF über gefährliche und beschwerliche Arbeiten bei Schwangerschaft und Mutterschaft
// Regulation of the WBF on dangerous and arduous work during pregnancy and maternity


// Data is structured Chapter => section => article
// We can also extracts tags about documents, from tag cloud
cachios
  .get(searchUrl)
  .then(({ data }) => data)
  .then(save(sr))
  .then(cheerioLoad)
  .then($ => ({
    isInForce: $('div.soft-green>div').html() === 'Dieser Text ist in Kraft.',
    sr: $('h1').eq(2).html(),
    title: $('h1').eq(3).html(),
    preamble: $('a[name=praeambel]').parent().text(),
    chapters: $('h1.title')
    // jquery is insane
      .map((i, el) => $(el).text()).get()
      // [ '1. Kapitel: Bearbeiten von Personendaten durch private Personen',
      // '2. Kapitel: Bearbeiten von Personendaten durch Bundesorgane',
      // '3. Kapitel: Register der Datensammlungen, Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter5  und Verfahren vor dem Bundesverwaltungsgericht6',
      // '4. Kapitel: Schlussbestimmungen' ]
      .map(s => s.trim()),
    // fullHtml: $('#lawcontent').html().trim()
    contents: $('#lawcontent h2')
      .map((i, s) => ({
        sectionName: $(s).text().trim(),
        sectionContents: $(s).next()
          .map((i, e) =>
            $(e).find('h5')
              .map((i, e) =>
                ({
                  articleName: $(e).text().trim(),
                  articleContents: $(e).nextAll().html() // can split by <p> need p.name
                })
              ).get()
          ).get()
      })).get()
  }))
  .then(JSON.stringify)
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

