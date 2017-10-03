module.exports = {
  "admin_ch_url" : "https://www.newsd.admin.ch/newsd/feeds/rss?lang=de&org-nr=101&topic=&keyword=&offer-nr=299,300,302&catalogueElement=&kind=&start_date=2015-07-10&end_date=&end_index=7"
};

var feedparser = require('feedparser-promised');

var items = [];
var blogParser = function(url) {
  return feedparser
    .parse(url)
    .catch(function (error) {
      console.error('error: ', error);
    });
}



module.exports = {
  "parse" : blogParser
}

var get = function(url) {
  return require('cachios')
    .get(url);
};

module.exports = {
  "get" : get
}

const _ = require('lodash')
const config = require('./config/parameter')

const fetch = (lastModified) => {
  if (!lastModified) {
    lastModified = new Date()
  }

  return require('./server/lib/blog/index')
    .parse(config.admin_ch_url)
    .then(function (anouncements) {
      const latest = anouncements
        .filter((anouncement) => Date.parse(anouncement.pubDate) > lastModified)
        .sort((a, b) => Date.parse(a.pubDate) < Date.parse(b.pubDate))
        .map((anouncement, index) => {
          if (index == 0) lastModified = anouncement.pubDate;
          require('./server/lib/html/index')
            .get(anouncement.link)
            .then(({data}) => data)
            .then(require('cheerio').load)
            .then($ =>
              $('#content table tr:not(:first-child)')
                .map((i, e) => $(e)
                  .find('td.nowrap')
                  .eq(1).text().trim()).get())
            .then((srs) => {
              const validSrs = srs.filter(e => !_.isEmpty(e))
              console.log(validSrs)
              return 'aaa';
            })
        })

      return lastModified
    })
}

module.exports = fetch

const fetch = require('./index.js')

// initially get all:
let lastModified = new Date(1970, 1, 1)

const exampleSrsFetchedToday = [
  '221.302',
  '221.302.3',
  '221.302.34',
  '412.101.221.28',
  '412.101.221.46',
  '414.131.1',
  '614.0',
  '631.012',
  '631.061',
  '734.27',
  '734.7',
  '734.71',
  '812.121.11',
  '823.201',
  '831.411',
  '831.42',
  '831.441.1',
  '933.011.3',
  '0.232.112.21',
  '0.941.16'
]

const { extract } = require('../scraper/adminCh')

module.exports = {
  exampleSrsFetchedToday,
  fetchAndExtract: () => fetch(lastModified)
    .then((newLastModified) => {
      lastModified = newLastModified
      console.log('done', lastModified)
    })
    .then(() =>
      Promise.all(exampleSrsFetchedToday.map(extract))
        .then(console.log))
}

{
  "name": "sbb-blog-legal-hack-2017",
  "version": "1.0.0",
  "description": "LegalHack2017 @Zurich",
  "main": "index.js",
  "scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
},
  "repository": {
  "type": "git",
    "url": "git+https://github.com/syzer/sbb-blog-legal-hack-2017.git"
},
  "author": "",
  "license": "ISC",
  "bugs": {
  "url": "https://github.com/syzer/sbb-blog-legal-hack-2017/issues"
},
  "homepage": "https://github.com/syzer/sbb-blog-legal-hack-2017#readme",
  "dependencies": {
  "cachios": "^1.0.6",
    "cheerio": "^1.0.0-rc.2",
    "feedparser-promised": "^1.4.2",
    "lodash": "^4.17.4",
    "mongoose": "^4.11.14",
    "request": "^2.83.0"
}
}


const fetch = require('../adminfetch')

// initially get all:
let lastModified = new Date(1970, 1, 1)

setInterval(() => {
  fetch(lastModified)
    .then((newLastModified) => {
      lastModified = newLastModified;
      console.log('done', lastModified)
    })
}, 5 * 1000)


{
  "name": "sbb-blog-legal-hack-2017",
  "version": "1.0.0",
  "description": "LegalHack2017 @Zurich",
  "main": "index.js",
  "scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
},
  "repository": {
  "type": "git",
    "url": "git+https://github.com/syzer/sbb-blog-legal-hack-2017.git"
},
  "author": "",
  "license": "ISC",
  "bugs": {
  "url": "https://github.com/syzer/sbb-blog-legal-hack-2017/issues"
},
  "homepage": "https://github.com/syzer/sbb-blog-legal-hack-2017#readme",
  "dependencies": {
}
}


const fs = require('fs')
const promisify = require('util').promisify
const bayes = require('syzer-level-naive-bayes')
const level = require('level')
const { dsg, employment } = require('../scraper/adminCh/interestingSr')
const { exampleSrsFetchedToday } = require('../adminfetch/runner')

const dsgFiles = dsg.map(sr => require(`../data/dsg/${sr}.json`))
const dsgData = dsgFiles.map(({ title, preamble }) => ({
  title,
  preamble
}))

const employmentFiles = employment.map(sr => require(`../data/json/${sr}.json`))
const employmentData = employmentFiles.map(({ title, preamble }) => ({
  title,
  preamble
}))

const spamFiles = exampleSrsFetchedToday.map(sr => require(`../data/json/${sr}.json`))
const spamData = employmentFiles.map(({ title, preamble }) => ({
  title,
  preamble
}))

const titles = level('./data/titles')
const preambles = level('./data/preambles')

const nb1 = bayes(titles)
const nb2 = bayes(preambles)

const train = () => {
  const titlesClassifier = dsgData.map(({ title }) => title)
    .map(e => nb1.trainAsync('dsg', e))
    .concat(
      employmentData
        .map(({ title }) => title)
        .map(e => nb1.trainAsync('employment', e)))
    .concat(
      spamData
        .map(({ title }) => title)
        .map(e => nb1.trainAsync('spam', e)))

  const preambleClassifier = dsgData
    .map(({ preamble }) => preamble)
    .map(e => nb2.trainAsync('dsg', e))
    .concat(
      employmentData
        .map(({ preamble }) => preamble)
        .map(e => nb2.trainAsync('employment', e)))
    .concat(
      spamData
        .map(({ preamble }) => preamble)
        .map(e => nb2.trainAsync('spam', e)))

  return Promise.all(titlesClassifier, preambleClassifier)
}

// test title
// employment
// const textToClassify = 'Verordnung über die Beseitigung von Benachteiligungen von Menschen mit Behinderungen'
// dsg
// const textToClassify = 'Bundesversammlung der Schweizerischen' // dsg
// spam
const textToClassify = `Verordnung des EDI über die Verzeichnisse der Betäubungsmittel, psychotropen Stoffe, Vorläuferstoffe und Hilfschemikalien`

Promise.all([
  nb1.classifyLabelsAsync(textToClassify),
  nb2.classifyLabelsAsync(textToClassify)
]).then(([cat1, cat2]) => {
  console.log('titles:', cat1)
  console.log('preamble:', cat2)
})

const cheerio = require('cheerio')
const _ = require('lodash')
const cheerioLoad = text => cheerio.load(text, { decodeEntities: false })

const text = `<p><sup><a
  name=\"1\">1</a></sup> Jede Person, die vom Inhaber einer Datensammlung Auskunft darüber verlangt, ob Daten über sie bearbeitet werden (Art. 8 DSG), muss dies in der Regel in schriftlicher Form beantragen und sich über ihre Identität ausweisen.</p>

<p>
<sup>
<a name=\"2\">2</a></sup> Das Auskunftsbegehren sowie die Auskunftserteilung können auf elektronischem Weg
erfolgen, wenn der Inhaber der Datensammlung dies ausdrücklich vorsieht und angemessene Massnahmen trifft, um:</p>
<dl compact=\"compact\">
    <dt>a.</dt>
    <dd>die Identifizierung der betroffenen Person sicherzustellen; und</dd>
<dt>b.</dt>
<dd>die persönlichen Daten der betroffenen Person bei der Auskunftserteilung vor dem Zugriff unberechtigter Dritter
zu schützen.<sup><a href=\"#fn-#a1-1\">1</a>
</sup>
</dd>
</dl>
<p><sup><a name=\"3\">3</a></sup> Im Einvernehmen mit dem Inhaber der Datensammlung oder auf dessen Vorschlag hin
kann die betroffene Person ihre Daten auch an Ort und Stelle einsehen. Die Auskunft kann auch mündlich erteilt
werden, wenn die betroffene Person eingewilligt hat und vom Inhaber identifiziert worden ist.</p><p><sup><a
name=\"4\">4</a></sup> Die Auskunft oder der begründete Entscheid über die Beschränkung des Auskunftsrechts
(Art. 9 und 10 DSG) wird innert 30 Tagen seit dem Eingang des Auskunftsbegehrens erteilt. Kann die Auskunft nicht
innert 30 Tagen erteilt werden, so muss der Inhaber der Datensammlung den Gesuchsteller hierüber benachrichtigen und
ihm die Frist mitteilen, in der die Auskunft erfolgen wird.</p><p><sup><a name=\"5\">5</a></sup> Werden eine oder
mehrere Datensammlungen von mehreren Inhabern gemeinsam geführt, kann das Auskunftsrecht bei jedem Inhaber geltend
gemacht werden, sofern nicht einer von ihnen für die Behandlung aller Auskunftsbegehren verantwortlich ist. Wenn der
Inhaber der Datensammlung zur Auskunftserteilung nicht ermächtigt ist, leitet er das Begehren an den Zuständigen
weiter.</p><p><sup><a name=\"6\">6</a></sup> Betrifft das Auskunftsbegehren Daten, die im Auftrag des Inhabers der
Datensammlung von einem Dritten bearbeitet werden, so leitet der Auftraggeber das Begehren an den Dritten zur
Erledigung weiter, sofern er nicht selbst in der Lage ist, Auskunft zu erteilen.<sup>
<a href=\"#fn-#a1-2\">2</a></sup></p><p><sup><a name=\"7\">7</a></sup> Wird Auskunft über Daten von
verstorbenen Personen verlangt, so ist sie zu erteilen, wenn der Gesuchsteller ein Interesse an der Auskunft
nachweist und keine überwiegenden Interessen von Angehörigen der verstorbenen Person oder von Dritten
entgegenstehen. Nahe Verwandtschaft sowie Ehe mit der verstorbenen Person begründen ein Interesse.</p>
<hr>
  <div class=\"fns\">
  <p>
    <small><a name=\"fn-#a1-1\"><sup>1</sup></a> Fassung gemäss Ziff. I der V vom 28. Sept. 2007, in Kraft seit 1.
    Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4993.pdf\">AS <strong>2007</strong> 4993</a>).<br><a
    name=\"fn-#a1-2\"><sup>2</sup></a> Fassung gemäss Ziff. I der V vom 28. Sept. 2007, in Kraft seit 1.
  Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4993.pdf\">AS <strong>2007</strong> 4993</a>).
</small>
</p>
</div></kkk>`

const $ = cheerioLoad(text)

const test = $('p').map((i, el) => ({
  paragraphName: $(el).text(),
  // paragraphContent: $('dl').text(),
})).get()

console.log(JSON.stringify(test))

// node 8.5
// nodemon -w ./ -D -e js -x 'node adminCh'

const cachios = require('cachios')
const _ = require('lodash')
const { cheerioLoad, save } = require('../lib/index')
const { parse } = require('./parser')
const { dsg, employment,  } = require('./interestingSr')

// const sr = `822.111` // employment law
// const sr = `742.147.2` // employment law
// const sr = `235.1` // DSG law ! with important change

// const searchUrl = sr =>  `https://www.admin.ch/opc/search/?text=${sr}&lang=de&language%5B%5D=de&product%5B%5D=cc&date_range_min=&date_range_max=&d_compilation=both&d_is_in_force=yes&thesaurus=1`
const searchUrl = sr => `http://www.admin.ch/opc/search/?text=${sr}&lang=de&language%5B%5D=de&product%5B%5D=ClassifiedCompilation`

// Data is structured Chapter => section => article
// We can also extracts tags about documents, from tag cloud
const extract = sr => Promise.all([sr].map(sr =>
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
      // fullHtml: $('#lawcontent').html().trim()
    }))
    .then(data => JSON.stringify(data, null, 2))
    .then(save(sr, 'json'))
    .then(console.log)
    .catch(console.error)))
  .then('all Done')
  .catch(console.error)


module.exports = {
  extract: sr => extract(sr)
}

// articles
const employment = [
  '822.11',
  '822.111',
  '822.111.52',
  '822.112',
  // '822.113',
  '822.115',
  '822.115.2',
  '822.115.4',
  '822.221',
  '822.222',
  // '142.20',
  // '142.201', // 100mb
  '151.1',
  '151.3',
  '151.31',
  // '220',
  '412.10',
  '412.101',
  '821.41',
  '822.31',
  '822.311',
  '822.14',
  '822.41',
  '822.411',
  '823.20',
  '823.201',
  '823.11',
  '823.111',
  '823.113',
  '172.220.1',
  // '172.220.111.3',
  // '172.220.111.31',
  // '172.220.111.4',
  '742.141.2',
  '742.141.21',
  // '742.141.22',
  '822.21',
  // '822.211'
]

const dsg = [
  '742.147.2',
  '235.1',
  '235.11',
  '152.3',
  '152.31',
  '152.1',
  '152.11'
]

module.exports = {
  employment,
  dsg
}


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

const util = require('util')
const fs = require('fs')
const cheerio = require('cheerio')
const writeAsync = util.promisify(fs.writeFile)
const cachios = require('cachios')
const _ = require('lodash')

const cheerioLoad = text => cheerio.load(text, { decodeEntities: false })

const save = (srNumber, type = 'html') => {
  // const id = _.uniqueId(srNumber)
  return data => {
    writeAsync(`./data/${type}/${srNumber}.${type}`, data, 'utf-8')
      .catch(console.error)
    return data // proxy thru
  }
}

module.exports = {
  cheerioLoad,
  save,
}


{
  "name": "scraper",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
},
  "author": "",
  "license": "ISC",
  "dependencies": {
  "cachios": "^1.0.6",
    "cheerio": "^1.0.0-rc.2",
    "lodash": "^4.17.4",
    "working-x-ray": "^2.0.3"
}
}


(function demo() {
  let leftData = ''
  let rightData = ''
  const timeout = 5000

  const onLeftEnterPressed = e => {
    console.log(e)
    if (e.which !== 13) {
      return
    }
    const path = e.target.value
    const url = `/${path}`

    axios.get(url, { timeout })
      .then(({ data }) => data)
      .then(left => leftData = left)
      .then(() => load.data({
        left: JSON.stringify(leftData),
        right: JSON.stringify(rightData)
      }))
      .catch(err => alert(err))
  }

  const onRightEnterPressed = e => {
    if (e.which !== 13) {
      return
    }
    const path = e.target.value
    const url = `  /${path}`

    axios.get(url, { timeout })
      .then(({ data }) => data)
      .then(right => rightData = right)
      .then(() => load.data({
        left: JSON.stringify(leftData),
        right: JSON.stringify(rightData)
      }))
      .catch(err => alert(err))
  }

  const newKeyboadEvent = (e, type = 'products') => ({
    which: 13,
    target: {
      value: `${type}/${e.target.value}.json`
    }
  })

  // get current products and discounts
  Promise.all([
    axios.get('/demo/left.json')
      .then(({ data }) => data)
      .then(els => els.map(({ id }) => id))
      .then(ids => {
        ids.map(id => $('#products').append($('<option>', {
          value: id,
          text: id
        })))
      }),

    axios.get('/demo/right.json')
      .then(({ data }) => data)
      .then(els => els.map(({ id }) => id))
      .then(ids => {
        ids.map(id => $('#discounts').append($('<option>', {
          value: id,
          text: id
        })))
      })])
    .then(() => {
      alert('Loaded ok')
      $('#products').change((e) => {
        $('#url-input-right').val(`products/${e.target.value}.json`)
        $('#url-input-left').val(`products/${e.target.value}.json`)
        onLeftEnterPressed(newKeyboadEvent(e, 'products'))
        onRightEnterPressed(newKeyboadEvent(e, 'products'))
      })
      $('#discounts').change((e) => {
        $('#url-input-right').val(`discounts/${e.target.value}.json`)
        $('#url-input-left').val(`discounts/${e.target.value}.json`)
        onLeftEnterPressed(newKeyboadEvent(e, 'discounts'))
        onRightEnterPressed(newKeyboadEvent(e, 'discounts'))
      })
    })

  // filter chosen item,
  $('#itemNr').change(() => {
    const itemNumber = $('#itemNr').val()
    load.data({
      left: JSON.stringify(leftData[itemNumber]),
      right: JSON.stringify(rightData[itemNumber])
    })
  })

  // load data services
  $('#url-input-left').keypress(onLeftEnterPressed)

  // load data fragments
  $('#url-input-right').keypress(onRightEnterPressed)

  // below this line are dragons ////////////////////////////
  var getExampleJson = function () {
    var data = {
      name: 'South America',
      summary: 'South America (Spanish: América del Sur, Sudamérica or  \n' +
      'Suramérica; Portuguese: América do Sul; Quechua and Aymara:  \n' +
      'Urin Awya Yala; Guarani: Ñembyamérika; Dutch: Zuid-Amerika;  \n' +
      'French: Amérique du Sud) is a continent situated in the  \n' +
      'Western Hemisphere, mostly in the Southern Hemisphere, with  \n' +
      'a relatively small portion in the Northern Hemisphere.  \n' +
      'The continent is also considered a subcontinent of the  \n' +
      'Americas.[2][3] It is bordered on the west by the Pacific  \n' +
      'Ocean and on the north and east by the Atlantic Ocean;  \n' +
      'North America and the Caribbean Sea lie to the northwest.  \n' +
      'It includes twelve countries: Argentina, Bolivia, Brazil,  \n' +
      'Chile, Colombia, Ecuador, Guyana, Paraguay, Peru, Suriname,  \n' +
      'Uruguay, and Venezuela. The South American nations that  \n' +
      'border the Caribbean Sea—including Colombia, Venezuela,  \n' +
      'Guyana, Suriname, as well as French Guiana, which is an  \n' +
      'overseas region of France—are also known as Caribbean South  \n' +
      'America. South America has an area of 17,840,000 square  \n' +
      'kilometers (6,890,000 sq mi). Its population as of 2005  \n' +
      'has been estimated at more than 371,090,000. South America  \n' +
      'ranks fourth in area (after Asia, Africa, and North America)  \n' +
      'and fifth in population (after Asia, Africa, Europe, and  \n' +
      'North America). The word America was coined in 1507 by  \n' +
      'cartographers Martin Waldseemüller and Matthias Ringmann,  \n' +
      'after Amerigo Vespucci, who was the first European to  \n' +
      'suggest that the lands newly discovered by Europeans were  \n' +
      'not India, but a New World unknown to Europeans.',

      surface: 17840000,
      timezone: [-4, -2],
      demographics: {
        population: 385742554,
        largestCities: ['São Paulo', 'Buenos Aires', 'Rio de Janeiro', 'Lima', 'Bogotá']
      },
      languages: ['spanish', 'portuguese', 'english', 'dutch',
        'french', 'quechua', 'guaraní', 'aimara', 'mapudungun'
      ],
      countries: [{
        name: 'Argentina',
        capital: 'Buenos Aires',
        independence: new Date(1816, 6, 9),
        unasur: true
      }, {
        name: 'Bolivia',
        capital: 'La Paz',
        independence: new Date(1825, 7, 6),
        unasur: true
      }, {
        name: 'Brazil',
        capital: 'Brasilia',
        independence: new Date(1822, 8, 7),
        unasur: true
      }, {
        name: 'Chile',
        capital: 'Santiago',
        independence: new Date(1818, 1, 12),
        unasur: true
      }, {
        name: 'Colombia',
        capital: 'Bogotá',
        independence: new Date(1810, 6, 20),
        unasur: true
      }, {
        name: 'Ecuador',
        capital: 'Quito',
        independence: new Date(1809, 7, 10),
        unasur: true
      }, {
        name: 'Guyana',
        capital: 'Georgetown',
        independence: new Date(1966, 4, 26),
        unasur: true
      }, {
        name: 'Paraguay',
        capital: 'Asunción',
        independence: new Date(1811, 4, 14),
        unasur: true
      }, {
        name: 'Peru',
        capital: 'Lima',
        independence: new Date(1821, 6, 28),
        unasur: true
      }, {
        name: 'Suriname',
        capital: 'Paramaribo',
        independence: new Date(1975, 10, 25),
        unasur: true
      }, {
        name: 'Uruguay',
        capital: 'Montevideo',
        independence: new Date(1825, 7, 25),
        unasur: true
      }, {
        name: 'Venezuela',
        capital: 'Caracas',
        independence: new Date(1811, 6, 5),
        unasur: true
      }]
    };

    var json = [JSON.stringify(data, null, 2)];

    data.summary = data.summary.replace('Brazil', 'Brasil').replace('also known as', 'a.k.a.');
    data.languages[2] = 'inglés';
    data.countries.pop();
    data.countries.pop();
    data.countries[0].capital = 'Rawson';
    data.countries.push({
      name: 'Antártida',
      unasur: false
    });

    // modify and move
    data.countries[4].population = 42888594;
    data.countries.splice(11, 0, data.countries.splice(4, 1)[0]);

    data.countries.splice(2, 0, data.countries.splice(7, 1)[0]);

    delete data.surface;
    data.spanishName = 'Sudamérica';
    data.demographics.population += 2342;

    json.push(JSON.stringify(data, null, 2));

    return json;
  };


  /* global jsondiffpatch */
  var instance = jsondiffpatch.create({
    objectHash: function (obj, index) {
      if (typeof obj._id !== 'undefined') {
        return obj._id;
      }
      if (typeof obj.id !== 'undefined') {
        return obj.id;
      }
      if (typeof obj.name !== 'undefined') {
        return obj.name;
      }
      return '$$index:' + index;
    }
  });

  var dom = {
    addClass: function (el, className) {
      if (el.classList) {
        el.classList.add(className);
      } else {
        el.className += ' ' + className;
      }
    },
    removeClass: function (el, className) {
      if (el.classList) {
        el.classList.remove(className);
      } else {
        el.className = el.className.replace(new RegExp('(^|\\b)' +
          className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
    },
    text: function (el, text) {
      if (typeof el.textContent !== 'undefined') {
        if (typeof text === 'undefined') {
          return el.textContent;
        }
        el.textContent = text;
      } else {
        if (typeof text === 'undefined') {
          return el.innerText;
        }
        el.innerText = text;
      }
    },
    on: function (el, eventName, handler) {
      if (el.addEventListener) {
        el.addEventListener(eventName, handler);
      } else {
        el.attachEvent('on' + eventName, handler);
      }
    },
    ready: function (fn) {
      if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn);
      } else {
        document.attachEvent('onreadystatechange', function () {
          if (document.readyState === 'interactive') {
            fn();
          }
        });
      }
    },
    getJson: function (url, callback) {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.onreadystatechange = function () {
        if (this.readyState === 4) {
          var data;
          try {
            data = JSON.parse(this.responseText, jsondiffpatch.dateReviver);
          } catch (parseError) {
            callback('parse error: ' + parseError);
          }
          if (this.status >= 200 && this.status < 400) {
            callback(null, data);
          } else {
            callback(new Error('request failed'), data);
          }
        }
      };
      request.send();
      request = null;
    },
    runScriptTags: function (el) {
      var scripts = el.querySelectorAll('script');
      for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        /* jshint evil: true */
        eval(s.innerHTML);
      }
    }
  };

  var trim = function (str) {
    return str.replace(/^\s+|\s+$/g, '');
  };

  var JsonArea = function JsonArea(element) {
    this.element = element;
    this.container = element.parentNode;
    var self = this;
    var prettifyButton = this.container.querySelector('.prettyfy');
    if (prettifyButton) {
      dom.on(prettifyButton, 'click', function () {
        self.prettyfy();
      });
    }
  };

  JsonArea.prototype.error = function (err) {
    var errorElement = this.container.querySelector('.error-message');
    if (!err) {
      dom.removeClass(this.container, 'json-error');
      errorElement.innerHTML = '';
      return;
    }
    errorElement.innerHTML = err + '';
    dom.addClass(this.container, 'json-error');
  };

  JsonArea.prototype.getValue = function () {
    if (!this.editor) {
      return this.element.value;
    }
    return this.editor.getValue();
  };

  JsonArea.prototype.parse = function () {
    var txt = trim(this.getValue());
    try {
      this.error(false);
      if (/^\d+(.\d+)?(e[\+\-]?\d+)?$/i.test(txt) ||
        /^(true|false)$/.test(txt) ||
        /^["].*["]$/.test(txt) ||
        /^[\{\[](.|\n)*[\}\]]$/.test(txt)) {
        return JSON.parse(txt, jsondiffpatch.dateReviver);
      }
      return this.getValue();
    } catch (err) {
      this.error(err);
      throw err;
    }
  };

  JsonArea.prototype.setValue = function (value) {
    if (!this.editor) {
      this.element.value = value;
      return;
    }
    this.editor.setValue(value);
  };

  JsonArea.prototype.prettyfy = function () {
    var value = this.parse();
    var prettyJson = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    this.setValue(prettyJson);
  };

  /* global CodeMirror */
  JsonArea.prototype.makeEditor = function (readOnly) {
    if (typeof CodeMirror === 'undefined') {
      return;
    }
    this.editor = CodeMirror.fromTextArea(this.element, {
      mode: 'javascript',
      json: true,
      readOnly: readOnly
    });
    if (!readOnly) {
      this.editor.on('change', compare);
    }
  };

  var areas = {
    left: new JsonArea(document.getElementById('json-input-left')),
    right: new JsonArea(document.getElementById('json-input-right')),
    delta: new JsonArea(document.getElementById('json-delta'))
  };

  var compare = function () {
    var left, right, error;
    document.getElementById('results').style.display = 'none';
    try {
      left = areas.left.parse();
    } catch (err) {
      error = err;
    }
    try {
      right = areas.right.parse();
    } catch (err) {
      error = err;
    }
    areas.delta.error(false);
    if (error) {
      areas.delta.setValue('');
      return;
    }
    var selectedType = getSelectedDeltaType();
    var visualdiff = document.getElementById('visualdiff');
    var annotateddiff = document.getElementById('annotateddiff');
    var jsondifflength = document.getElementById('jsondifflength');
    try {
      var delta = instance.diff(left, right);

      if (typeof delta === 'undefined') {
        switch (selectedType) {
          case 'visual':
            visualdiff.innerHTML = 'no diff';
            break;
          case 'annotated':
            annotateddiff.innerHTML = 'no diff';
            break;
          case 'json':
            areas.delta.setValue('no diff');
            jsondifflength.innerHTML = '0';
            break;
        }
      } else {
        switch (selectedType) {
          case 'visual':
            visualdiff.innerHTML = jsondiffpatch.formatters.html.format(delta, left);
            if (!document.getElementById('showunchanged').checked) {
              jsondiffpatch.formatters.html.hideUnchanged();
            }
            dom.runScriptTags(visualdiff);
            break;
          case 'annotated':
            annotateddiff.innerHTML = jsondiffpatch.formatters.annotated.format(delta);
            break;
          case 'json':
            areas.delta.setValue(JSON.stringify(delta, null, 2));
            jsondifflength.innerHTML = (Math.round(JSON.stringify(delta).length / 102.4) / 10.0) + '';
            break;
        }
      }
    } catch (err) {
      jsondifflength.innerHTML = '0';
      visualdiff.innerHTML = '';
      annotateddiff.innerHTML = '';
      areas.delta.setValue('');
      areas.delta.error(err);
      if (typeof console !== 'undefined' && console.error) {
        console.error(err);
        console.error(err.stack);
      }
    }
    document.getElementById('results').style.display = '';
  };

  areas.left.makeEditor();
  areas.right.makeEditor();

  dom.on(areas.left.element, 'change', compare);
  dom.on(areas.right.element, 'change', compare);
  dom.on(areas.left.element, 'keyup', compare);
  dom.on(areas.right.element, 'keyup', compare);

  var getSelectedDeltaType = function () {
    if (document.getElementById('show-delta-type-visual').checked) {
      return 'visual';
    }
    if (document.getElementById('show-delta-type-annotated').checked) {
      return 'annotated';
    }
    if (document.getElementById('show-delta-type-json').checked) {
      return 'json';
    }
  };

  var showSelectedDeltaType = function () {
    var type = getSelectedDeltaType();
    document.getElementById('delta-panel-visual').style.display =
      type === 'visual' ? '' : 'none';
    document.getElementById('delta-panel-annotated').style.display =
      type === 'annotated' ? '' : 'none';
    document.getElementById('delta-panel-json').style.display =
      type === 'json' ? '' : 'none';
    compare();
  };

  dom.on(document.getElementById('show-delta-type-visual'), 'click', showSelectedDeltaType);
  dom.on(document.getElementById('show-delta-type-annotated'), 'click', showSelectedDeltaType);
  dom.on(document.getElementById('show-delta-type-json'), 'click', showSelectedDeltaType);

  dom.on(document.getElementById('swap'), 'click', function () {
    var leftValue = areas.left.getValue();
    areas.left.setValue(areas.right.getValue());
    areas.right.setValue(leftValue);
    compare();
  });

  dom.on(document.getElementById('clear'), 'click', function () {
    areas.left.setValue('');
    areas.right.setValue('');
    compare();
  });

  dom.on(document.getElementById('showunchanged'), 'change', function () {
    jsondiffpatch.formatters.html.showUnchanged(document.getElementById('showunchanged').checked, null, 800);
  });

  dom.ready(function () {
    setTimeout(compare);
  }, 1);

  var load = {};

  load.data = function (data) {
    data = data || {};
    dom.text(document.getElementById('description'), data.description || '');
    if (data.url && trim(data.url).substr(0, 10) !== 'javascript') {
      document.getElementById('external-link').setAttribute('href', data.url);
      document.getElementById('external-link').style.display = '';
    } else {
      document.getElementById('external-link').style.display = 'none';
    }
    var leftValue = data.left ? (data.left.content || data.left) : '';
    areas.left.setValue(leftValue);
    var rightValue = data.right ? (data.right.content || data.right) : '';
    areas.right.setValue(rightValue);

    dom.text(document.getElementById('json-panel-left').querySelector('h2'), (data.left && data.left.name) || 'left.json');
    dom.text(document.getElementById('json-panel-right').querySelector('h2'), (data.right && data.right.name) || 'right.json');

    document.getElementById('json-panel-left').querySelector('h2').setAttribute(
      'title', (data.left && data.left.fullname) || '');
    document.getElementById('json-panel-right').querySelector('h2').setAttribute(
      'title', (data.right && data.right.fullname) || '');

    if (data.error) {
      areas.left.setValue('ERROR LOADING: ' + data.error);
      areas.right.setValue('');
    }
  };

  load.gist = function (id) {
    dom.getJson('https://api.github.com/gists/' + id, function (error, data) {
      if (error) {
        var message = error + ((data && data.message) ? data.message : '');
        load.data({
          error: message
        });
        return;
      }
      var filenames = [];
      for (var filename in data.files) {
        var file = data.files[filename];
        if (file.language === 'JSON') {
          filenames.push(filename);
        }
      }
      filenames.sort();
      var files = [
        data.files[filenames[0]],
        data.files[filenames[1]]
      ];
      /*jshint camelcase: false */
      load.data({
        url: data.html_url,
        description: data.description,
        left: {
          name: files[0].filename,
          content: files[0].content
        },
        right: {
          name: files[1].filename,
          content: files[1].content
        }
      });
    });
  };

  load.leftright = function (description, leftValue, rightValue) {
    try {
      description = decodeURIComponent(description || '');
      leftValue = decodeURIComponent(leftValue);
      rightValue = decodeURIComponent(rightValue);
      var urlmatch = /https?:\/\/.*\/([^\/]+\.json)(?:[\?#].*)?/;
      var dataLoaded = {
        description: description,
        left: {},
        right: {}
      };
      var loadIfReady = function () {
        if (typeof dataLoaded.left.content !== 'undefined' &&
          typeof dataLoaded.right.content !== 'undefined') {
          load.data(dataLoaded);
        }
      };
      if (urlmatch.test(leftValue)) {
        dataLoaded.left.name = urlmatch.exec(leftValue)[1];
        dataLoaded.left.fullname = leftValue;
        dom.getJson(leftValue, function (error, data) {
          if (error) {
            dataLoaded.left.content = error + ((data && data.message) ? data.message : '');
          } else {
            dataLoaded.left.content = JSON.stringify(data, null, 2);
          }
          loadIfReady();
        });
      } else {
        dataLoaded.left.content = leftValue;
      }
      if (urlmatch.test(rightValue)) {
        dataLoaded.right.name = urlmatch.exec(rightValue)[1];
        dataLoaded.right.fullname = rightValue;
        dom.getJson(rightValue, function (error, data) {
          if (error) {
            dataLoaded.right.content = error + ((data && data.message) ? data.message : '');
          } else {
            dataLoaded.right.content = JSON.stringify(data, null, 2);
          }
          loadIfReady();
        });
      } else {
        dataLoaded.right.content = rightValue;
      }
      loadIfReady();
    } catch (err) {
      console.warn(err)
    }
  };

  load.key = function (key) {
    var matchers = {
      gist: /^(?:https?:\/\/)?(?:gist\.github\.com\/)?(?:[\w0-9\-a-f]+\/)?([0-9a-f]+)$/i,
      leftright: /^(?:desc=(.*)?&)?left=(.*)&right=(.*)&?$/i,
    };
    for (var loader in matchers) {
      var match = matchers[loader].exec(key);
      if (match) {
        return load[loader].apply(load, match.slice(1));
      }
    }
    load.data({
      error: 'unsupported source: ' + key
    });
  };

  var urlQuery = /^[^?]*\?([^\#]+)/.exec(document.location.href);
  if (urlQuery) {
    load.key(urlQuery[1]);
  } else {
    Promise.all([
      axios.get('/demo/left.json'),
      axios.get('/demo/right.json')
    ])
      .then(([left, right]) => {
        load.data({
          left: JSON.stringify(left.data),
          right: JSON.stringify(right.data)
        })
      })
  }

  dom.on(document.getElementById('examples'), 'change', function () {
      var example = trim(this.value);
      switch (example) {
        case 'text':
          var exampleJson = getExampleJson();
          load.data({
            left: {
              name: 'left.json',
              content: JSON.parse(exampleJson[0]).summary
            },
            right: {
              name: 'right.json',
              content: JSON.parse(exampleJson[1]).summary
            }
          });
          break;
        case
        'gist'
        :
          document.location = '?benjamine/9188826';
          break;
        case
        'moving'
        :
          document.location = '?desc=moving%20around&left=' +
            encodeURIComponent(JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])) +
            '&right=' +
            encodeURIComponent(JSON.stringify([10, 0, 1, 7, 2, 4, 5, 6, 88, 9, 3]));
          break;
        case
        'query'
        :
          document.location = '?desc=encoded%20in%20url&left=' +
            /* jshint quotmark: false */
            encodeURIComponent(JSON.stringify({
              "don't": "abuse",
              "with": ["large", "urls"]
            })) +
            '&right=' +
            encodeURIComponent(JSON.stringify({
              "don't": "use",
              "with": [">", 2, "KB urls"]
            }));
          break;
        case
        'urls'
        :
          document.location = '?desc=http%20raw%20file%20urls&left=' +
            encodeURIComponent('https://rawgithub.com/benjamine/JsonDiffPatch/' +
              'c83e942971c627f61ef874df3cfdd50a95f1c5a2/package.json') +
            '&right=' +
            encodeURIComponent('https://rawgithub.com/benjamine/JsonDiffPatch/master/package.json');
          break;
        default:
          document.location = '?';
          break;
      }
    }
  );
})();


<!DOCTYPE html>
<html>

<head>
  <title>Diffing products</title>
  <meta content="text/html;charset=utf-8" http-equiv="Content-Type">
    <meta content="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <link rel="stylesheet" href="formatters-styles/style.css" type="text/css" media="screen"/>
        <link rel="stylesheet" href="formatters-styles/html.css" type="text/css" media="screen"/>
        <link rel="stylesheet" href="formatters-styles/annotated.css" type="text/css" media="screen"/>
        <link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/codemirror.min.css"
              type="text/css" media="screen"/>
        <script src='jsondiffpatch.min.js'></script>
        <script src='jsondiffpatch-formatters.min.js'></script>
        <script src='diff_match_patch_uncompressed.js'></script>
        <script src="codemirror.js"></script>
        <script src="javascript.min.js"></script>
        <script src="jquery-3.1.1.min.js"></script>
        <script src="axios.min.js"></script>
</head>

<body>
<header>
  <h1 style="display: none">Your<span class="jsondiffpatch-textdiff-deleted">
        <span>on</span></span><span class="jsondiffpatch-textdiff-added"><span>Dayily</span></span>Mail</h1>
  <span id="description"></span>
  <a id="external-link" style="display: none;">source</a>
</header>
<div class="buttons">
  <div>
    <!--<select id="products">-->
    <!--<option value="" disabled selected>products</option>-->
    <!--</select>-->
    <!--<select id="discounts">-->
    <!--<option value="" disabled selected>discounts</option>-->
    <!--</select>-->
    <input id="show" type="button" value="show related document">
      <input id="swap" type="button" value="Swap">
        <input id="clear" type="button" value="Clear">
          <select id="examples">
            <option value="" disabled selected>left right</option>
          </select>
  </div>
</div>
<br/><br />
<div id="documentshow" style="display: none;">
  <div id=\"toolbar\" class=\"pull-right\">\n            <a href=\"#\" id=\"expande-all\">alles einblenden</a> | <a href=\"#\" id=\"collapse-allArticle\">Artikelübersicht</a> | <a href=\"#\" id=\"collapse-all\">alles ausblenden</a> | <a href=\"/opc/de/print.html\" id=\"printversion\" class=\"icon icon--before icon--print\" target=\"_blank\" rel=\"nofollow\"></a>\n        </div>\n        <div><a name=\"kopf\"></a><h1>235.1</h1><h1>Bundesgesetz über den Datenschutz</h1><h2>(DSG)</h2><p>vom 19. Juni 1992 (Stand am 1. Januar 2014)</p><div><a name=\"praeambel\"></a><p><em>Die Bundesversammlung der Schweizerischen Eidgenossenschaft,</em></p><p>gestützt auf die Artikel 95, 122 und 173 Absatz 2 der Bundesverfassung<sup><a href=\"#fn1\">1</a></sup>,<sup><a href=\"#fn2\">2</a></sup> nach Einsicht in die Botschaft des Bundesrates vom 23. März 1988<sup><a href=\"#fn3\">3</a></sup>,</p><p><em>beschliesst:</em></p></div></div><a name=\"id-1\" id=\"lawid-1\"></a><h1 class=\"title smallh1\"><span> </span><span> </span><a href=\"index.html#id-1\">1. Abschnitt: Zweck, Geltungsbereich und Begriffe</a></h1><div class=\"collapseable\"><a name=\"a1\" id=\"lawid-1-0-0-0-1\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a1\"><strong>Art. 1</strong> Zweck</a></h5><div class=\"collapseableArticle\"><p>Dieses Gesetz bezweckt den Schutz der Persönlichkeit und der Grundrechte von Personen, über die Daten bearbeitet werden.</p></div><a name=\"a2\" id=\"lawid-1-0-0-0-2\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a2\"><strong>Art. 2</strong> Geltungsbereich</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Dieses Gesetz gilt für das Bearbeiten von Daten natürlicher und juristischer Personen durch:</p><dl compact=\"compact\"><dt>a.</dt><dd>private Personen;</dd><dt>b.</dt><dd>Bundesorgane.</dd></dl><p><sup><a name=\"2\">2</a></sup> Es ist nicht anwendbar auf:</p><dl compact=\"compact\"><dt>a.</dt><dd>Personendaten, die eine natürliche Person ausschliesslich zum persönlichen Gebrauch bearbeitet und nicht an Aussenstehende bekannt gibt;</dd><dt>b.</dt><dd>Beratungen in den Eidgenössischen Räten und in den parlamentarischen Kommissionen;</dd><dt>c.</dt><dd>hängige Zivilprozesse, Strafverfahren, Verfahren der internationalen Rechtshilfe sowie staats- und verwaltungsrechtliche Verfahren mit Ausnahme erstinstanzlicher Verwaltungsverfahren;</dd><dt>d.</dt><dd>öffentliche Register des Privatrechtsverkehrs;</dd><dt>e.</dt><dd>Personendaten, die das Internationale Komitee vom Roten Kreuz bearbeitet.</dd></dl></div><a name=\"a3\" id=\"lawid-1-0-0-0-3\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a3\"><strong>Art. 3</strong> Begriffe</a></h5><div class=\"collapseableArticle\"><p>Die folgenden Ausdrücke bedeuten:</p><dl compact=\"compact\"><dt>a.</dt><dd><em>Personendaten (Daten):</em> alle Angaben, die sich auf eine bestimmte oder bestimmbare Person beziehen;</dd><dt>b.</dt><dd><em>betroffene Personen:</em> natürliche oder juristische Personen, über die Daten bearbeitet werden;</dd><dt>c.</dt><dd><em>besonders schützenswerte Personendaten:</em> Daten über: <dl compact=\"compact\"><dt>1.</dt><dd>die religiösen, weltanschaulichen, politischen oder gewerkschaftlichen Ansichten oder Tätigkeiten,</dd><dt>2.</dt><dd>die Gesundheit, die Intimsphäre oder die Rassenzugehörigkeit,</dd><dt>3.</dt><dd>Massnahmen der sozialen Hilfe,</dd><dt>4.</dt><dd>administrative oder strafrechtliche Verfolgungen und Sanktionen;</dd></dl></dd><dt>d.</dt><dd><em>Persönlichkeitsprofil:</em> eine Zusammenstellung von Daten, die eine Beurteilung wesentlicher Aspekte der Persönlichkeit einer natürlichen Person erlaubt;</dd><dt>e.</dt><dd><em>Bearbeiten:</em> jeder Umgang mit Personendaten, unabhängig von den angewandten Mitteln und Verfahren, insbesondere das Beschaffen, Aufbewahren, Verwenden, Umarbeiten, Bekanntgeben, Archivieren oder Vernichten von Daten;</dd><dt>f.</dt><dd><em>Bekanntgeben:</em> das Zugänglichmachen von Personendaten wie das Einsichtgewähren, Weitergeben oder Veröffentlichen;</dd><dt>g.</dt><dd><em>Datensammlung:</em> jeder Bestand von Personendaten, der so aufgebaut ist, dass die Daten nach betroffenen Personen erschliessbar sind;</dd><dt>h.</dt><dd><em>Bundesorgane:</em> Behörden und Dienststellen des Bundes sowie Personen, soweit sie mit öffentlichen Aufgaben des Bundes betraut sind;</dd><dt>i.<sup><a href=\"#fn-#a3-1\">1</a></sup></dt><dd><em>Inhaber der Datensammlung:</em> private Personen oder Bundesorgane, die über den Zweck und den Inhalt der Datensammlung entscheiden;</dd><dt>j.<sup><a href=\"#fn-#a3-2\">2</a></sup></dt><dd><em>Gesetz im formellen Sinn:</em><dl compact=\"compact\"><dt>1.</dt><dd>Bundesgesetze,</dd><dt>2.</dt><dd>für die Schweiz verbindliche Beschlüsse internationaler Organisationen und von der Bundesversammlung genehmigte völkerrechtliche Verträge mit rechtsetzendem Inhalt;</dd></dl></dd><dt>k.<sup><a href=\"#fn-#a3-3\">3</a></sup></dt><dd>…</dd></dl><hr><div class=\"fns\"><p><small><a name=\"fn-#a3-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a3-2\"><sup>2</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a3-3\"><sup>3</sup></a> Aufgehoben durch Ziff. I des BG vom 24. März 2006, mit Wirkung seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><br></div><a name=\"id-2\" id=\"lawid-2\"></a><h1 class=\"title smallh1\"><span> </span><span> </span><a href=\"index.html#id-2\">2. Abschnitt: Allgemeine Datenschutzbestimmungen</a></h1><div class=\"collapseable\"><a name=\"a4\" id=\"lawid-2-0-0-0-4\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a4\"><strong>Art. 4</strong> Grundsätze</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Personendaten dürfen nur rechtmässig bearbeitet werden.<sup><a href=\"#fn-#a4-1\">1</a></sup></p><p><sup><a name=\"2\">2</a></sup> Ihre Bearbeitung hat nach Treu und Glauben zu erfolgen und muss verhältnismässig sein.</p><p><sup><a name=\"3\">3</a></sup> Personendaten dürfen nur zu dem Zweck bearbeitet werden, der bei der Beschaffung angegeben wurde, aus den Umständen ersichtlich oder gesetzlich vorgesehen ist.</p><p><sup><a name=\"4\">4</a></sup> Die Beschaffung von Personendaten und insbesondere der Zweck ihrer Bearbeitung müssen für die betroffene Person erkennbar sein.<sup><a href=\"#fn-#a4-2\">2</a></sup></p><p><sup><a name=\"5\">5</a></sup> Ist für die Bearbeitung von Personendaten die Einwilligung der betroffenen Person erforderlich, so ist diese Einwilligung erst gültig, wenn sie nach angemessener Information freiwillig erfolgt. Bei der Bearbeitung von besonders schützenswerten Personendaten oder Persönlichkeitsprofilen muss die Einwilligung zudem ausdrücklich erfolgen.<sup><a href=\"#fn-#a4-3\">3</a></sup></p><hr><div class=\"fns\"><p><small><a name=\"fn-#a4-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a4-2\"><sup>2</sup></a> Eingefügt durch Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a4-3\"><sup>3</sup></a> Eingefügt durch Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a5\" id=\"lawid-2-0-0-0-5\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a5\"><strong>Art. 5</strong> Richtigkeit der Daten</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Wer Personendaten bearbeitet, hat sich über deren Richtigkeit zu vergewissern. Er hat alle angemessenen Massnahmen zu treffen, damit die Daten berichtigt oder vernichtet werden, die im Hinblick auf den Zweck ihrer Beschaffung oder Bearbeitung unrichtig oder unvollständig sind.<sup><a href=\"#fn-#a5-1\">1</a></sup></p><p><sup><a name=\"2\">2</a></sup> Jede betroffene Person kann verlangen, dass unrichtige Daten berichtigt werden.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a5-1\"><sup>1</sup></a> Zweiter Satz eingefügt durch Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a6\" id=\"lawid-2-0-0-0-6\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a6\"><strong>Art. 6</strong></a><sup><a href=\"#fn-#a6-1\">1</a></sup><a href=\"index.html#a6\">Grenzüberschreitende Bekanntgabe</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Personendaten d                                                                                                                                                          ürfen nicht ins Ausland bekannt gegeben werden, wenn dadurch die Persönlichkeit der betroffenen Personen schwerwiegend gefährdet würde, namentlich weil eine Gesetzgebung fehlt, die einen angemessenen Schutz gewährleistet.</p><p><sup><a name=\"2\">2</a></sup> Fehlt eine Gesetzgebung, die einen angemessenen Schutz gewährleistet, so können Personendaten ins Ausland nur bekannt gegeben werden, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>hinreichende Garantien, insbesondere durch Vertrag, einen angemessenen Schutz im Ausland gewährleisten;</dd><dt>b.</dt><dd>die betroffene Person im Einzelfall eingewilligt hat;</dd><dt>c.</dt><dd>die Bearbeitung in unmittelbarem Zusammenhang mit dem Abschluss oder der Abwicklung eines Vertrags steht und es sich um Personendaten des Vertragspartners handelt;</dd><dt>d.</dt><dd>die Bekanntgabe im Einzelfall entweder für die Wahrung eines überwiegenden öffentlichen Interesses oder für die Feststellung, Ausübung oder Durchsetzung von Rechtsansprüchen vor Gericht unerlässlich ist;</dd><dt>e.</dt><dd>die Bekanntgabe im Einzelfall erforderlich ist, um das Leben oder die körperliche Integrität der betroffenen Person zu schützen;</dd><dt>f.</dt><dd>die betroffene Person die Daten allgemein zugänglich gemacht und eine Bearbeitung nicht ausdrücklich untersagt hat;</dd><dt>g.</dt><dd>die Bekanntgabe innerhalb derselben juristischen Person oder Gesellschaft oder zwischen juristischen Personen oder Gesellschaften, die einer einheitlichen Leitung unterstehen, stattfindet, sofern die Beteiligten Datenschutzregeln unterstehen, welche einen angemessenen Schutz gewährleisten.</dd></dl><p><sup><a name=\"3\">3</a></sup> Der Eidgenössische Datenschutz- und Öffentlichkeitsbeauftragte (Beauftragte, Art. 26) muss über die Garantien nach Absatz 2 Buchstabe a und die Datenschutzregeln nach Absatz 2 Buchstabe g informiert werden. Der Bundesrat regelt die Einzelheiten dieser Informationspflicht.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a6-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a7\" id=\"lawid-2-0-0-0-7\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a7\"><strong>Art. 7</strong> Datensicherheit</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Personendaten müssen durch angemessene technische und organisatorische Massnahmen gegen unbefugtes Bearbeiten geschützt werden.</p><p><sup><a name=\"2\">2</a></sup> Der Bundesrat erlässt nähere Bestimmungen über die Mindestanforderungen an die Datensicherheit.</p></div><a name=\"a7a\" id=\"lawid-2-0-0-0-8\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a7a\"><strong>Art. 7</strong><em>a</em></a><sup><a href=\"#fn-#a7a-1\">1</a></sup><a href=\"index.html#a7a\"></a></h5><div class=\"collapseableArticle\"><hr><div class=\"fns\"><p><small><a name=\"fn-#a7a-1\"><sup>1</sup></a> Eingefügt durch Ziff. I des BG vom 24. März 2006 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>). Aufgehoben durch Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, mit Wirkung seit 1. Dez. 2010 (AS <strong>2010</strong> 3387 3418; BBl <strong>2009</strong> 6749).</small></p></div></div><a name=\"a8\" id=\"lawid-2-0-0-0-9\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a8\"><strong>Art. 8</strong> Auskunftsrecht</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Jede Person kann vom Inhaber einer Datensammlung Auskunft darüber verlangen, ob Daten über sie bearbeitet werden.</p><p><sup><a name=\"2\">2</a></sup> Der Inhaber der Datensammlung muss der betroffenen Person mitteilen:<sup><a href=\"#fn-#a8-1\">1</a></sup></p><dl compact=\"compact\"><dt>a.<sup><a href=\"#fn-#a8-2\">2</a></sup></dt><dd>alle über sie in der Datensammlung vorhandenen Daten einschliesslich der verfügbaren Angaben über die Herkunft der Daten;</dd><dt>b.</dt><dd>den Zweck und gegebenenfalls die Rechtsgrundlagen des Bearbeitens sowie die Kategorien der bearbeiteten Personendaten, der an der Sammlung Beteiligten und der Datenempfänger.</dd></dl><p><sup><a name=\"3\">3</a></sup> Daten über die Gesundheit kann der Inhaber der Datensammlung der betroffenen Person durch einen von ihr bezeichneten Arzt mitteilen lassen.</p><p><sup><a name=\"4\">4</a></sup> Lässt der Inhaber der Datensammlung Personendaten durch einen Dritten bearbeiten, so bleibt er auskunftspflichtig. Der Dritte ist auskunftspflichtig, wenn er den Inhaber nicht bekannt gibt oder dieser keinen Wohnsitz in der Schweiz hat.</p><p><sup><a name=\"5\">5</a></sup> Die Auskunft ist in der Regel schriftlich, in Form eines Ausdrucks oder einer Fotokopie sowie kostenlos zu erteilen. Der Bundesrat regelt die Ausnahmen.</p><p><sup><a name=\"6\">6</a></sup> Niemand kann im Voraus auf das Auskunftsrecht verzichten.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a8-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a8-2\"><sup>2</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a9\" id=\"lawid-2-0-0-0-10\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a9\"><strong>Art. 9</strong></a><sup><a href=\"#fn-#a9-1\">1</a></sup><a href=\"index.html#a9\">Einschränkung des Auskunftsrechts</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Inhaber der Datensammlung kann die Auskunft verweigern, einschränken oder aufschieben, soweit:</p><dl compact=\"compact\"><dt>a.</dt><dd>ein Gesetz im formellen Sinn dies vorsieht;</dd><dt>b.</dt><dd>es wegen überwiegender Interessen Dritter erforderlich ist.</dd></dl><p><sup><a name=\"2\">2</a></sup> Ein Bundesorgan kann zudem die Auskunft verweigern, einschränken oder aufschieben, soweit:</p><dl compact=\"compact\"><dt>a.</dt><dd>es wegen überwiegender öffentlicher Interessen, insbesondere der inneren oder äusseren Sicherheit der Eidgenossenschaft, erforderlich ist;</dd><dt>b.</dt><dd>die Auskunft den Zweck einer Strafuntersuchung oder eines andern Untersuchungsverfahrens in Frage stellt.</dd></dl><p><sup><a name=\"3\">3</a></sup> Sobald der Grund für die Verweigerung, Einschränkung oder Aufschiebung einer Auskunft wegfällt, muss das Bundesorgan die Auskunft erteilen, ausser dies ist unmöglich oder nur mit einem unverhältnismässigen Aufwand möglich.</p><p><sup><a name=\"4\">4</a></sup> Der private Inhaber einer Datensammlung kann zudem die Auskunft verweigern, einschränken oder aufschieben, soweit eigene überwiegende Interessen es erfordern und er die Personendaten nicht Dritten bekannt gibt.</p><p><sup><a name=\"5\">5</a></sup> Der Inhaber der Datensammlung muss angeben, aus welchem Grund er die Auskunft verweigert, einschränkt oder aufschiebt.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a9-1\"><sup>1</sup></a> Fassung gemäss Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).</small></p></div></div><a name=\"a10\" id=\"lawid-2-0-0-0-11\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a10\"><strong>Art. 10</strong> Einschränkungen des Auskunftsrechts für Medienschaffende</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Inhaber einer Datensammlung, die ausschliesslich für die Veröffentlichung im redaktionellen Teil eines periodisch erscheinenden Mediums verwendet wird, kann die Auskunft verweigern, einschränken oder aufschieben, soweit:</p><dl compact=\"compact\"><dt>a.</dt><dd>die Personendaten Aufschluss über die Informationsquellen geben;</dd><dt>b.</dt><dd>Einblick in Entwürfe für Publikationen gegeben werden müsste;</dd><dt>c.</dt><dd>die freie Meinungsbildung des Publikums gefährdet würde.</dd></dl><p><sup><a name=\"2\">2</a></sup> Medienschaffende können die Auskunft zudem verweigern, einschränken oder aufschieben, wenn ihnen eine Datensammlung ausschliesslich als persönliches Arbeitsinstrument dient.</p></div><a name=\"a10a\" id=\"lawid-2-0-0-0-12\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a10a\"><strong>Art. 10</strong><em>a</em></a><sup><a href=\"#fn-#a10a-1\">1</a></sup><a href=\"index.html#a10a\">Datenbearbeitung durch Dritte</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Das Bearbeiten von Personendaten kann durch Vereinbarung oder Gesetz Dritten übertragen werden, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>die Daten nur so bearbeitet werden, wie der Auftraggeber selbst es tun dürfte; und</dd><dt>b.</dt><dd>keine gesetzliche oder vertragliche Geheimhaltungspflicht es verbietet.</dd></dl><p><sup><a name=\"2\">2</a></sup> Der Auftraggeber muss sich insbesondere vergewissern, dass der Dritte die Datensicherheit gewährleistet.</p><p><sup><a name=\"3\">3</a></sup> Dritte können dieselben Rechtfertigungsgründe geltend machen wie der Auftraggeber.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a10a-1\"><sup>1</sup></a> Eingefügt durch Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a11\" id=\"lawid-2-0-0-0-13\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a11\"><strong>Art. 11</strong></a><sup><a href=\"#fn-#a11-1\">1</a></sup><a href=\"index.html#a11\">Zertifizierungsverfahren</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Um den Datenschutz und die Datensicherheit zu verbessern, können die Hersteller von Datenbearbeitungssystemen oder -programmen sowie private Personen oder Bundesorgane, die Personendaten bearbeiten, ihre Systeme, Verfahren und ihre Organisation einer Bewertung durch anerkannte unabhängige Zertifizierungsstellen unterziehen.</p><p><sup><a name=\"2\">2</a></sup> Der Bundesrat erlässt Vorschriften über die Anerkennung von Zertifizierungsverfahren und die Einführung eines Datenschutz-Qualitätszeichens. Er berücksichtigt dabei das internationale Recht und die international anerkannten technischen Normen.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a11-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a11a\" id=\"lawid-2-0-0-0-14\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a11a\"><strong>Art. 11</strong><em>a</em></a><sup><a href=\"#fn-#a11a-1\">1</a></sup><a href=\"index.html#a11a\">Register der Datensammlungen</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Beauftragte führt ein Register der Datensammlungen, das über Internet zugänglich ist. Jede Person kann das Register einsehen.</p><p><sup><a name=\"2\">2</a></sup> Bundesorgane müssen sämtliche Datensammlungen beim Beauftragten zur Registrierung anmelden.</p><p><sup><a name=\"3\">3</a></sup> Private Personen müssen Datensammlungen anmelden, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>regelmässig besonders schützenswerte Personendaten oder Persönlichkeitsprofile bearbeitet werden; oder</dd><dt>b.</dt><dd>regelmässig Personendaten an Dritte bekannt gegeben werden.</dd></dl><p><sup><a name=\"4\">4</a></sup> Die Datensammlungen müssen angemeldet werden, bevor sie eröffnet werden.</p><p><sup><a name=\"5\">5</a></sup> Entgegen den Bestimmungen der Absätze 2 und 3 muss der Inhaber von Datensammlungen seine Sammlungen nicht anmelden, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>private Personen Daten aufgrund einer gesetzlichen Verpflichtung bearbeiten;</dd><dt>b.</dt><dd>der Bundesrat eine Bearbeitung von der Anmeldepflicht ausgenommen hat, weil sie die Rechte der betroffenen Personen nicht gefährdet;</dd><dt>c.</dt><dd>er die Daten ausschliesslich für die Veröffentlichung im redaktionellen Teil eines periodisch erscheinenden Mediums verwendet und keine Daten an Dritte weitergibt, ohne dass die betroffenen Personen davon Kenntnis haben;</dd><dt>d.</dt><dd>die Daten durch Journalisten bearbeitet werden, denen die Datensammlung ausschliesslich als persönliches Arbeitsinstrument dient;</dd><dt>e.</dt><dd>er einen Datenschutzverantwortlichen bezeichnet hat, der unabhängig die betriebsinterne Einhaltung der Datenschutzvorschriften überwacht und ein Verzeichnis der Datensammlungen führt;</dd><dt>f.</dt><dd>er aufgrund eines Zertifizierungsverfahrens nach Artikel 11 ein Datenschutz-Qualitätszeichen erworben hat und das Ergebnis der Bewertung dem Beauftragten mitgeteilt wurde.</dd></dl><p><sup><a name=\"6\">6</a></sup> Der Bundesrat regelt die Modalitäten der Anmeldung der Datensammlungen, der Führung und der Veröffentlichung des Registers sowie die Stellung und die Aufgaben der Datenschutzverantwortlichen nach Absatz 5 Buchstabe e und die Veröffentlichung eines Verzeichnisses der Inhaber der Datensammlungen, welche nach Absatz 5 Buchstaben e und f der Meldepflicht enthoben sind.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a11a-1\"><sup>1</sup></a> Eingefügt durch Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><br></div><a name=\"id-3\" id=\"lawid-3\"></a><h1 class=\"title smallh1\"><span> </span><span> </span><a href=\"index.html#id-3\">3. Abschnitt: Bearbeiten von Personendaten durch private Personen</a></h1><div class=\"collapseable\"><a name=\"a12\" id=\"lawid-3-0-0-0-15\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a12\"><strong>Art. 12</strong> Persönlichkeitsverletzungen</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Wer Personendaten bearbeitet, darf dabei die Persönlichkeit der betroffenen Personen nicht widerrechtlich verletzen.</p><p><sup><a name=\"2\">2</a></sup> Er darf insbesondere nicht:</p><dl compact=\"compact\"><dt>a.</dt><dd>Personendaten entgegen den Grundsätzen der Artikel 4, 5 Absatz 1 und 7 Absatz 1 bearbeiten;</dd><dt>b.</dt><dd>ohne Rechtfertigungsgrund Daten einer Person gegen deren ausdrücklichen Willen bearbeiten;</dd><dt>c.</dt><dd>ohne Rechtfertigungsgrund besonders schützenswerte Personendaten oder Persönlichkeitsprofile Dritten bekanntgeben.<sup><a href=\"#fn-#a12-1\">1</a></sup></dd></dl><p><sup><a name=\"3\">3</a></sup> In der Regel liegt keine Persönlichkeitsverletzung vor, wenn die betroffene Person die Daten allgemein zugänglich gemacht und eine Bearbeitung nicht ausdrücklich untersagt hat.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a12-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a13\" id=\"lawid-3-0-0-0-16\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a13\"><strong>Art. 13</strong> Rechtfertigungsgründe</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Eine Verletzung der Persönlichkeit ist widerrechtlich, wenn sie nicht durch Einwilligung des Verletzten, durch ein überwiegendes privates oder öffentliches Interesse oder durch Gesetz gerechtfertigt ist.</p><p><sup><a name=\"2\">2</a></sup> Ein überwiegendes Interesse der bearbeitenden Person fällt insbesondere in Betracht, wenn diese:</p><dl compact=\"compact\"><dt>a.</dt><dd>in unmittelbarem Zusammenhang mit dem Abschluss oder der Abwicklung eines Vertrags Personendaten über ihren Vertragspartner bearbeitet;</dd><dt>b.</dt><dd>mit einer anderen Person in wirtschaftlichem Wettbewerb steht oder treten will und zu diesem Zweck Personendaten bearbeitet, ohne diese Dritten bekannt zu geben;</dd><dt>c.</dt><dd>zur Prüfung der Kreditwürdigkeit einer anderen Person weder besonders schützenswerte Personendaten noch Persönlichkeitsprofile bearbeitet und Dritten nur Daten bekannt gibt, die sie für den Abschluss oder die Abwicklung eines Vertrages mit der betroffenen Person benötigen;</dd><dt>d.</dt><dd>beruflich Personendaten ausschliesslich für die Veröffentlichung im redaktionellen Teil eines periodisch erscheinenden Mediums bearbeitet;</dd><dt>e.</dt><dd>Personendaten zu nicht personenbezogenen Zwecken insbesondere in der Forschung, Planung und Statistik bearbeitet und die Ergebnisse so veröffentlicht, dass die betroffenen Personen nicht bestimmbar sind;</dd><dt>f.</dt><dd>Daten über eine Person des öffentlichen Lebens sammelt, sofern sich die Daten auf das Wirken dieser Person in der Öffentlichkeit beziehen.</dd></dl></div><a name=\"a14\" id=\"lawid-3-0-0-0-17\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a14\"><strong>Art. 14</strong></a><sup><a href=\"#fn-#a14-1\">1</a></sup><a href=\"index.html#a14\">Informationspflicht beim Beschaffen von besonders schützenswerten Personendaten und Persönlichkeitsprofilen</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Inhaber der Datensammlung ist verpflichtet, die betroffene Person über die Beschaffung von besonders schützenswerten Personendaten oder Persönlichkeitsprofilen zu informieren; diese Informationspflicht gilt auch dann, wenn die Daten bei Dritten beschafft werden.</p><p><sup><a name=\"2\">2</a></sup> Der betroffenen Person sind mindestens mitzuteilen:</p><dl compact=\"compact\"><dt>a.</dt><dd>der Inhaber der Datensammlung;</dd><dt>b.</dt><dd>der Zweck des Bearbeitens;</dd><dt>c.</dt><dd>die Kategorien der Datenempfänger, wenn eine Datenbekanntgabe vorgesehen ist.</dd></dl><p><sup><a name=\"3\">3</a></sup> Werden die Daten nicht bei der betroffenen Person beschafft, so hat deren Information spätestens bei der Speicherung der Daten oder, wenn die Daten nicht gespeichert werden, mit ihrer ersten Bekanntgabe an Dritte zu erfolgen.</p><p><sup><a name=\"4\">4</a></sup> Die Informationspflicht des Inhabers der Datensammlung entfällt, wenn die betroffene Person bereits informiert wurde oder, in Fällen nach Absatz 3, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>die Speicherung oder die Bekanntgabe der Daten ausdrücklich im Gesetz vorgesehen ist; oder</dd><dt>b.</dt><dd>die Information nicht oder nur mit unverhältnismässigem Aufwand möglich ist.</dd></dl><p><sup><a name=\"5\">5</a></sup> Der Inhaber der Datensammlung kann die Information unter den in Artikel 9 Absätze 1 und 4 genannten Voraussetzungen verweigern, einschränken oder aufschieben.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a14-1\"><sup>1</sup></a> Fassung gemäss Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).</small></p></div></div><a name=\"a15\" id=\"lawid-3-0-0-0-18\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a15\"><strong>Art. 15</strong></a><sup><a href=\"#fn-#a15-1\">1</a></sup><a href=\"index.html#a15\">Rechtsansprüche</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Klagen zum Schutz der Persönlichkeit richten sich nach den Artikeln 28, 28<em>a</em> sowie 28<em>l</em> des Zivilgesetzbuchs<sup><a href=\"#fn-#a15-2\">2</a></sup>. Die klagende Partei kann insbesondere verlangen, dass die Datenbearbeitung gesperrt wird, keine Daten an Dritte bekannt gegeben oder die Personendaten berichtigt oder vernichtet werden.</p><p><sup><a name=\"2\">2</a></sup> Kann weder die Richtigkeit noch die Unrichtigkeit von Personendaten dargetan werden, so kann die klagende Partei verlangen, dass bei den Daten ein entsprechender Vermerk angebracht wird.</p><p><sup><a name=\"3\">3</a></sup> Die klagende Partei kann zudem verlangen, dass die Berichtigung, die Vernichtung, die Sperre, namentlich die Sperre der Bekanntgabe an Dritte, der Vermerk über die Bestreitung oder das Urteil Dritten mitgeteilt oder veröffentlicht wird.</p><p><sup><a name=\"4\">4</a></sup> Über Klagen zur Durchsetzung des Auskunftsrechts entscheidet das Gericht im vereinfachten Verfahren nach der Zivilprozessordnung vom 19. Dezember 2008<sup><a href=\"#fn-#a15-3\">3</a></sup>.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a15-1\"><sup>1</sup></a> Fassung gemäss Anhang 1 Ziff. II 14 der Zivilprozessordnung vom 19. Dez. 2008, in Kraft seit 1. Jan. 2011 (<a href=\"http://www.admin.ch/ch/d/as/2010/1739.pdf\">AS <strong>2010</strong> 1739</a>; <a href=\"http://www.admin.ch/ch/d/ff/2006/7221.pdf\">BBl <strong>2006</strong> 7221</a>).<br><a name=\"fn-#a15-2\"><sup>2</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c210.html\">210</a></strong><br><a name=\"fn-#a15-3\"><sup>3</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c272.html\">272</a></strong></small></p></div></div><br></div><a name=\"id-4\" id=\"lawid-4\"></a><h1 class=\"title smallh1\"><span> </span><span> </span><a href=\"index.html#id-4\">4. Abschnitt: Bearbeiten von Personendaten durch Bundesorgane</a></h1><div class=\"collapseable\"><a name=\"a16\" id=\"lawid-4-0-0-0-19\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a16\"><strong>Art. 16</strong> Verantwortliches Organ und Kontrolle</a><sup><a href=\"#fn-#a16-1\">1</a></sup><a href=\"index.html#a16\"></a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Für den Datenschutz ist das Bundesorgan verantwortlich, das die Personendaten in Erfüllung seiner Aufgaben bearbeitet oder bearbeiten lässt.</p><p><sup><a name=\"2\">2</a></sup> Bearbeiten Bundesorgane Personendaten zusammen mit anderen Bundesorganen, mit kantonalen Organen oder mit Privaten, so kann der Bundesrat die Kontrolle und Verantwortung für den Datenschutz besonders regeln.<sup><a href=\"#fn-#a16-2\">2</a></sup></p><hr><div class=\"fns\"><p><small><a name=\"fn-#a16-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a16-2\"><sup>2</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a17\" id=\"lawid-4-0-0-0-20\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a17\"><strong>Art. 17</strong> Rechtsgrundlagen</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Organe des Bundes dürfen Personendaten bearbeiten, wenn dafür eine gesetzliche Grundlage besteht.</p><p><sup><a name=\"2\">2</a></sup> Besonders schützenswerte Personendaten sowie Persönlichkeitsprofile dürfen sie nur bearbeiten, wenn ein Gesetz im formellen Sinn es ausdrücklich vorsieht oder wenn ausnahmsweise:</p><dl compact=\"compact\"><dt>a.</dt><dd>es für eine in einem Gesetz im formellen Sinn klar umschriebene Aufgabe unentbehrlich ist;</dd><dt>b.</dt><dd>der Bundesrat es im Einzelfall bewilligt, weil die Rechte der betroffenen Person nicht gefährdet sind; oder</dd><dt>c.</dt><dd>die betroffene Person im Einzelfall eingewilligt oder ihre Daten allgemein zugänglich gemacht und eine Bearbeitung nicht ausdrücklich untersagt hat.<sup><a href=\"#fn-#a17-1\">1</a></sup></dd></dl><hr><div class=\"fns\"><p><small><a name=\"fn-#a17-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a17a\" id=\"lawid-4-0-0-0-21\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a17a\"><strong>Art. 17</strong><em>a</em></a><sup><a href=\"#fn-#a17a-1\">1</a></sup><a href=\"index.html#a17a\">Automatisierte Datenbearbeitung im Rahmen von Pilotversuchen</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Bundesrat kann, nachdem er die Stellungnahme des Beauftragten eingeholt hat, vor Inkrafttreten eines Gesetzes im formellen Sinn die automatisierte Bearbeitung von besonders schützenswerten Personendaten oder Persönlichkeitsprofilen bewilligen, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>die Aufgaben, die diese Bearbeitung erforderlich machen, in einem Gesetz im formellen Sinn geregelt sind;</dd><dt>b.</dt><dd>ausreichende Massnahmen zur Verhinderung von Persönlichkeitsverletzungen getroffen werden;</dd><dt>c.</dt><dd>die praktische Umsetzung einer Datenbearbeitung eine Testphase vor dem Inkrafttreten des Gesetzes im formellen Sinn zwingend erfordert.</dd></dl><p><sup><a name=\"2\">2</a></sup> Die praktische Umsetzung einer Datenbearbeitung kann eine Testphase dann zwingend erfordern, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>die Erfüllung einer Aufgabe technische Neuerungen erfordert, deren Auswirkungen zunächst evaluiert werden müssen;</dd><dt>b.</dt><dd>die Erfüllung einer Aufgabe bedeutende organisatorische oder technische Massnahmen erfordert, deren Wirksamkeit zunächst geprüft werden muss, insbesondere bei der Zusammenarbeit zwischen Organen des Bundes und der Kantone; oder</dd><dt>c.</dt><dd>sie die Übermittlung von besonders schützenswerten Personendaten oder Persönlichkeitsprofilen an kantonale Behörden mittels eines Abrufverfahrens erfordert.</dd></dl><p><sup><a name=\"3\">3</a></sup> Der Bundesrat regelt die Modalitäten der automatisierten Datenbearbeitung in einer Verordnung.</p><p><sup><a name=\"4\">4</a></sup> Das zuständige Bundesorgan legt dem Bundesrat spätestens innert zwei Jahren nach Inbetriebnahme des Pilotsystems einen Evaluationsbericht vor. Es schlägt darin die Fortführung oder die Einstellung der Bearbeitung vor.</p><p><sup><a name=\"5\">5</a></sup> Die automatisierte Datenbearbeitung muss in jedem Fall abgebrochen werden, wenn innert fünf Jahren nach der Inbetriebnahme des Pilotsystems kein Gesetz im formellen Sinn in Kraft getreten ist, welches die erforderliche Rechtsgrundlage umfasst.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a17a-1\"><sup>1</sup></a> Eingefügt durch Ziff. I des BG vom 24. März 2006 (<a href=\"http://www.admin.ch/ch/d/as/2006/4873.pdf\">AS <strong>2006</strong> 4873</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>, <strong>2006</strong> 3547). Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 15. Dez. 2006 (AS <strong>2007</strong> 4983; BBl <strong>2003</strong> 2101).</small></p></div></div><a name=\"a18\" id=\"lawid-4-0-0-0-22\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a18\"><strong>Art. 18</strong> Beschaffen von Personendaten</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Bei systematischen Erhebungen, namentlich mit Fragebogen, gibt das Bundesorgan den Zweck und die Rechtsgrundlage des Bearbeitens, die Kategorien der an der Datensammlung Beteiligten und der Datenempfänger bekannt.</p><p><sup><a name=\"2\">2</a></sup> …<sup><a href=\"#fn-#a18-1\">1</a></sup></p><hr><div class=\"fns\"><p><small><a name=\"fn-#a18-1\"><sup>1</sup></a> Aufgehoben durch Ziff. I des BG vom 24. März 2006, mit Wirkung seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a18a\" id=\"lawid-4-0-0-0-23\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a18a\"><strong>Art. 18</strong><em>a</em></a><sup><a href=\"#fn-#a18a-1\">1</a></sup><a href=\"index.html#a18a\">Informationspflicht beim Beschaffen von Personendaten</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Bundesorgane sind verpflichtet, die betroffene Person über die Beschaffung von Personendaten zu informieren; diese Informationspflicht gilt auch dann, wenn die Daten bei Dritten beschafft werden.</p><p><sup><a name=\"2\">2</a></sup> Der betroffenen Person sind mindestens mitzuteilen:</p><dl compact=\"compact\"><dt>a.</dt><dd>der Inhaber der Datensammlung;</dd><dt>b.</dt><dd>der Zweck des Bearbeitens;</dd><dt>c.</dt><dd>die Kategorien der Datenempfänger, wenn eine Datenbekanntgabe vorgesehen ist;</dd><dt>d.</dt><dd>das Auskunftsrecht nach Artikel 8;</dd><dt>e.</dt><dd>die Folgen einer Weigerung der betroffenen Person, die verlangten Personendaten anzugeben.</dd></dl><p><sup><a name=\"3\">3</a></sup> Werden die Daten nicht bei der betroffenen Person beschafft, so hat deren Information spätestens bei der Speicherung der Daten oder, wenn die Daten nicht gespeichert werden, mit ihrer ersten Bekanntgabe an Dritte zu erfolgen.</p><p><sup><a name=\"4\">4</a></sup> Die Informationspflicht der Bundesorgane entfällt, wenn die betroffene Person bereits informiert wurde oder, in Fällen nach Absatz 3, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>die Speicherung oder die Bekanntgabe der Daten ausdrücklich im Gesetz vorgesehen ist; oder</dd><dt>b.</dt><dd>die Information nicht oder nur mit unverhältnismässigem Aufwand möglich ist.</dd></dl><p><sup><a name=\"5\">5</a></sup> Wenn die Informationspflicht die Wettbewerbsfähigkeit eines Bundesorganes beeinträchtigen würde, so kann sie der Bundesrat auf die Beschaffung von besonders schützenswerten Personendaten und von Persönlichkeitsprofilen beschränken.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a18a-1\"><sup>1</sup></a> Eingefügt durch Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).</small></p></div></div><a name=\"a18b\" id=\"lawid-4-0-0-0-24\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a18b\"><strong>Art. 18</strong><em>b</em></a><sup><a href=\"#fn-#a18b-1\">1</a></sup><a href=\"index.html#a18b\">Einschränkung der Informationspflicht</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Bundesorgane können die Information unter den in Artikel 9 Absätze 1 und 2 genannten Voraussetzungen verweigern, einschränken oder aufschieben.</p><p><sup><a name=\"2\">2</a></sup> Sobald der Grund für die Verweigerung, Einschränkung oder Aufschiebung wegfällt, sind die Bundesorgane durch die Informationspflicht gebunden, ausser diese ist unmöglich oder nur mit einem unverhältnismässigen Aufwand zu erfüllen.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a18b-1\"><sup>1</sup></a> Eingefügt durch Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).</small></p></div></div><a name=\"a19\" id=\"lawid-4-0-0-0-25\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a19\"><strong>Art. 19</strong> Bekanntgabe von Personendaten</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Bundesorgane dürfen Personendaten nur bekannt geben, wenn dafür eine Rechtsgrundlage im Sinne von Artikel 17 besteht oder wenn:<sup><a href=\"#fn-#a19-1\">1</a></sup></p><dl compact=\"compact\"><dt>a.</dt><dd>die Daten für den Empfänger im Einzelfall zur Erfüllung seiner gesetzlichen Aufgabe unentbehrlich sind;</dd><dt>b.<sup><a href=\"#fn-#a19-2\">2</a></sup></dt><dd>die betroffene Person im Einzelfall eingewilligt hat;</dd><dt>c.<sup><a href=\"#fn-#a19-3\">3</a></sup></dt><dd>die betroffene Person ihre Daten allgemein zugänglich gemacht und eine Bekanntgabe nicht ausdrücklich untersagt hat; oder</dd><dt>d.</dt><dd>der Empfänger glaubhaft macht, dass die betroffene Person die Einwilligung verweigert oder die Bekanntgabe sperrt, um ihm die Durchsetzung von Rechtsansprüchen oder die Wahrnehmung anderer schutzwürdiger Interessen zu verwehren; der betroffenen Person ist vorher wenn möglich Gelegenheit zur Stellungnahme zu geben.</dd></dl><p><sup><a name=\"1bis\">1bis</a></sup> Bundesorgane dürfen im Rahmen der behördlichen Information der Öffentlichkeit von Amtes wegen oder gestützt auf das Öffentlichkeitsgesetz vom 17. Dezember 2004<sup><a href=\"#fn-#a19-4\">4</a></sup> auch Personendaten bekannt geben, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>die betreffenden Personendaten im Zusammenhang mit der Erfüllung öffentlicher Aufgaben stehen; und</dd><dt>b.</dt><dd>an deren Bekanntgabe ein überwiegendes öffentliches Interesse besteht.<sup><a href=\"#fn-#a19-5\">5</a></sup></dd></dl><p><sup><a name=\"2\">2</a></sup> Bundesorgane dürfen auf Anfrage Name, Vorname, Adresse und Geburtsdatum einer Person auch bekannt geben, wenn die Voraussetzungen von Absatz 1 nicht erfüllt sind.</p><p><sup><a name=\"3\">3</a></sup> Bundesorgane dürfen Personendaten durch ein Abrufverfahren zugänglich machen, wenn dies ausdrücklich vorgesehen ist. Besonders schützenswerte Personendaten sowie Persönlichkeitsprofile dürfen nur durch ein Abrufverfahren zugänglich gemacht werden, wenn ein Gesetz im formellen Sinn es ausdrücklich vorsieht.<sup><a href=\"#fn-#a19-6\">6</a></sup></p><p><sup><a name=\"3bis\">3bis</a></sup> Bundesorgane dürfen Personendaten mittels automatisierter Informations- und Kommunikationsdienste jedermann zugänglich machen, wenn eine Rechtsgrundlage die Veröffentlichung dieser Daten vorsieht oder wenn sie gestützt auf Absatz 1<sup>bis</sup> Informationen der Öffentlichkeit zugänglich machen. Besteht das öffentliche Interesse an der Zugänglichmachung nicht mehr, so sind die betreffenden Daten wieder aus dem automatisierten Informations- und Kommunikationsdienst zu entfernen.<sup><a href=\"#fn-#a19-7\">7</a></sup></p><p><sup><a name=\"4 \">4 </a></sup> Das Bundesorgan lehnt die Bekanntgabe ab, schränkt sie ein oder verbindet sie mit Auflagen, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>wesentliche öffentliche Interessen oder offensichtlich schutzwürdige Interessen einer betroffenen Person es verlangen oder</dd><dt>b.</dt><dd>gesetzliche Geheimhaltungspflichten oder besondere Datenschutzvorschriften es verlangen.</dd></dl><hr><div class=\"fns\"><p><small><a name=\"fn-#a19-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a19-2\"><sup>2</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a19-3\"><sup>3</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a19-4\"><sup>4</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c152_3.html\">152.3</a></strong><br><a name=\"fn-#a19-5\"><sup>5</sup></a> Eingefügt durch Anhang Ziff. 4 des Öffentlichkeitsgesetzes vom 17. Dez. 2004, in Kraft seit 1. Juli 2006 (<a href=\"http://www.admin.ch/ch/d/as/2006/2319.pdf\">AS <strong>2006</strong> 2319</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/1963.pdf\">BBl <strong>2003</strong> 1963</a>).<br><a name=\"fn-#a19-6\"><sup>6</sup></a> Fassung des zweiten Satzes gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a19-7\"><sup>7</sup></a> Eingefügt durch Anhang Ziff. 4 des Öffentlichkeitsgesetzes vom 17. Dez. 2004, in Kraft seit 1. Juli 2006 (<a href=\"http://www.admin.ch/ch/d/as/2006/2319.pdf\">AS <strong>2006</strong> 2319</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/1963.pdf\">BBl <strong>2003</strong> 1963</a>).</small></p></div></div><a name=\"a20\" id=\"lawid-4-0-0-0-26\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a20\"><strong>Art. 20</strong> Sperrung der Bekanntgabe</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Eine betroffene Person, die ein schutzwürdiges Interesse glaubhaft macht, kann vom verantwortlichen Bundesorgan verlangen, dass es die Bekanntgabe von bestimmten Personendaten sperrt.</p><p><sup><a name=\"2\">2</a></sup> Das Bundesorgan verweigert die Sperrung oder hebt sie auf, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>eine Rechtspflicht zur Bekanntgabe besteht; oder</dd><dt>b.</dt><dd>die Erfüllung seiner Aufgabe sonst gefährdet wäre.</dd></dl><p><sup><a name=\"3\">3</a></sup> Die Sperrung steht unter dem Vorbehalt von Artikel 19 Absatz 1<sup>bis</sup>.<sup><a href=\"#fn-#a20-1\">1</a></sup></p><hr><div class=\"fns\"><p><small><a name=\"fn-#a20-1\"><sup>1</sup></a> Eingefügt durch Anhang Ziff. 4 des Öffentlichkeitsgesetzes vom 17. Dez. 2004, in Kraft seit 1. Juli 2006 (<a href=\"http://www.admin.ch/ch/d/as/2006/2319.pdf\">AS <strong>2006</strong> 2319</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/1963.pdf\">BBl <strong>2003</strong> 1963</a>).</small></p></div></div><a name=\"a21\" id=\"lawid-4-0-0-0-27\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a21\"><strong>Art. 21</strong></a><sup><a href=\"#fn-#a21-1\">1</a></sup><a href=\"index.html#a21\">Angebot von Unterlagen an das Bundesarchiv</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> In Übereinstimmung mit dem Archivierungsgesetz vom 26. Juni 1998<sup><a href=\"#fn-#a21-2\">2</a></sup> bieten die Bundesorgane dem Bundesarchiv alle Personendaten an, die sie nicht mehr ständig benötigen.</p><p><sup><a name=\"2\">2</a></sup> Die Bundesorgane vernichten die vom Bundesarchiv als nicht archivwürdig bezeichneten Personendaten, ausser wenn diese:</p><dl compact=\"compact\"><dt>a.</dt><dd>anonymisiert sind;</dd><dt>b.<sup><a href=\"#fn-#a21-3\">3</a></sup></dt><dd>zu Beweis- oder Sicherheitszwecken oder zur Wahrung der schutzwürdigen Interessen der betroffenen Person aufbewahrt werden müssen.</dd></dl><hr><div class=\"fns\"><p><small><a name=\"fn-#a21-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a21-2\"><sup>2</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c152_1.html\">152.1</a></strong><br><a name=\"fn-#a21-3\"><sup>3</sup></a> Fassung gemäss Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).</small></p></div></div><a name=\"a22\" id=\"lawid-4-0-0-0-28\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a22\"><strong>Art. 22</strong> Bearbeiten für Forschung, Planung und Statistik</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Bundesorgane dürfen Personendaten für nicht personenbezogene Zwecke, insbesondere für Forschung, Planung und Statistik bearbeiten, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>die Daten anonymisiert werden, sobald es der Zweck des Bearbeitens erlaubt;</dd><dt>b.</dt><dd>der Empfänger die Daten nur mit Zustimmung des Bundesorgans weitergibt; und</dd><dt>c.</dt><dd>die Ergebnisse so veröffentlicht werden, dass die betroffenen Personen nicht bestimmbar sind.</dd></dl><p><sup><a name=\"2\">2</a></sup> Die Anforderungen der folgenden Bestimmungen müssen nicht erfüllt sein:</p><dl compact=\"compact\"><dt>a.</dt><dd>Artikel 4 Absatz 3 über den Zweck des Bearbeitens</dd><dt>b.</dt><dd>Artikel 17 Absatz 2 über die Rechtsgrundlagen für die Bearbeitung von besonders schützenswerten Personendaten und Persönlichkeitsprofilen;</dd><dt>c.</dt><dd>Artikel 19 Absatz 1 über die Bekanntgabe von Personendaten.</dd></dl></div><a name=\"a23\" id=\"lawid-4-0-0-0-29\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a23\"><strong>Art. 23</strong> Privatrechtliche Tätigkeit von Bundesorganen</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Handelt ein Bundesorgan privatrechtlich, so gelten die Bestimmungen für das Bearbeiten von Personendaten durch private Personen.</p><p><sup><a name=\"2\">2</a></sup> Die Aufsicht richtet sich nach den Bestimmungen für Bundesorgane.</p></div><a name=\"a24\" id=\"lawid-4-0-0-0-30\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a24\"><strong>Art. 24</strong></a><sup><a href=\"#fn-#a24-1\">1</a></sup><a href=\"index.html#a24\"></a></h5><div class=\"collapseableArticle\"><hr><div class=\"fns\"><p><small><a name=\"fn-#a24-1\"><sup>1</sup></a> Aufgehoben durch Art. 31 des BG vom 21. März 1997 über Massnahmen zur Wahrung der inneren Sicherheit (AS <strong>1998</strong> 1546; BBl <strong>1994</strong> II 1127).</small></p></div></div><a name=\"a25\" id=\"lawid-4-0-0-0-31\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a25\"><strong>Art. 25</strong> Ansprüche und Verfahren</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Wer ein schutzwürdiges Interesse hat, kann vom verantwortlichen Bundesorgan verlangen, dass es:</p><dl compact=\"compact\"><dt>a.</dt><dd>das widerrechtliche Bearbeiten von Personendaten unterlässt;</dd><dt>b.</dt><dd>die Folgen eines widerrechtlichen Bearbeitens beseitigt;</dd><dt>c.</dt><dd>die Widerrechtlichkeit des Bearbeitens feststellt.</dd></dl><p><sup><a name=\"2\">2</a></sup> Kann weder die Richtigkeit noch die Unrichtigkeit von Personendaten bewiesen werden, so muss das Bundesorgan bei den Daten einen entsprechenden Vermerk anbringen.</p><p><sup><a name=\"3\">3</a></sup> Der Gesuchsteller kann insbesondere verlangen, dass das Bundesorgan:</p><dl compact=\"compact\"><dt>a.</dt><dd>Personendaten berichtigt, vernichtet oder die Bekanntgabe an Dritte sperrt;</dd><dt>b.</dt><dd>seinen Entscheid, namentlich die Berichtigung, Vernichtung, Sperre oder den Vermerk über die Bestreitung Dritten mitteilt oder veröffentlicht.</dd></dl><p><sup><a name=\"4\">4</a></sup> Das Verfahren richtet sich nach dem Bundesgesetz vom 20. Dezember 1968<sup><a href=\"#fn-#a25-1\">1</a></sup> über das Verwaltungsverfahren (Verwaltungsverfahrensgesetz). Die Ausnahmen von Artikel 2 und 3 des Verwaltungsverfahrensgesetzes gelten nicht.</p><p><sup><a name=\"5\">5</a></sup> …<sup><a href=\"#fn-#a25-2\">2</a></sup></p><hr><div class=\"fns\"><p><small><a name=\"fn-#a25-1\"><sup>1</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c172_021.html\">172.021</a></strong><br><a name=\"fn-#a25-2\"><sup>2</sup></a> Aufgehoben durch Anhang Ziff. 26 des Verwaltungsgerichtsgesetzes vom 17. Juni 2005, mit Wirkung seit 1. Jan. 2007 (<a href=\"http://www.admin.ch/ch/d/as/2006/2197.pdf\">AS <strong>2006</strong> 2197</a>; <a href=\"http://www.admin.ch/ch/d/ff/2001/4202.pdf\">BBl <strong>2001</strong> 4202</a>).</small></p></div></div><a name=\"a25bis\" id=\"lawid-4-0-0-0-32\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a25bis\"><strong>Art. 25</strong><sup>bis</sup></a><sup><a href=\"#fn-#a25bis-1\">1</a></sup><a href=\"index.html#a25bis\">Verfahren im Falle der Bekanntgabe von amtlichen Dokumenten, die Personendaten enthalten</a></h5><div class=\"collapseableArticle\"><p>Solange ein Verfahren betreffend den Zugang zu amtlichen Dokumenten im Sinne des Öffentlichkeitsgesetzes vom 17. Dezember 2004<sup><a href=\"#fn-#a25bis-2\">2</a></sup>, welche Personendaten enthalten, im Gange ist, kann die betroffene Person im Rahmen dieses Verfahrens die Rechte geltend machen, die ihr aufgrund von Artikel 25 des vorliegenden Gesetzes bezogen auf diejenigen Dokumente zustehen, die Gegenstand des Zugangsverfahrens sind.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a25bis-1\"><sup>1</sup></a> Eingefügt durch Anhang Ziff. 4 des Öffentlichkeitsgesetzes vom 17. Dez. 2004, in Kraft seit 1. Juli 2006 (<a href=\"http://www.admin.ch/ch/d/as/2006/2319.pdf\">AS <strong>2006</strong> 2319</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/1963.pdf\">BBl <strong>2003</strong> 1963</a>).<br><a name=\"fn-#a25bis-2\"><sup>2</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c152_3.html\">152.3</a></strong></small></p></div></div><br></div><a name=\"id-5\" id=\"lawid-5\"></a><h1 class=\"title smallh1\"><span> </span><span> </span><a href=\"index.html#id-5\">5. Abschnitt: Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter</a></h1><div class=\"collapseable\"><a name=\"a26\" id=\"lawid-5-0-0-0-33\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a26\"><strong>Art. 26</strong></a><sup><a href=\"#fn-#a26-1\">1</a></sup><a href=\"index.html#a26\">Wahl und Stellung</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Beauftragte wird vom Bundesrat für eine Amtsdauer von vier Jahren gewählt. Die Wahl ist durch die Bundesversammlung zu genehmigen.</p><p><sup><a name=\"2\">2</a></sup> Das Arbeitsverhältnis des Beauftragten richtet sich, soweit dieses Gesetz nichts anderes vorsieht, nach dem Bundespersonalgesetz vom 24. März 2000<sup><a href=\"#fn-#a26-2\">2</a></sup>.</p><p><sup><a name=\"3\">3</a></sup> Der Beauftragte übt seine Funktion unabhängig aus, ohne Weisungen einer Behörde zu erhalten. Er ist der Bundeskanzlei administrativ zugeordnet.</p><p><sup><a name=\"4\">4</a></sup> Er verfügt über ein ständiges Sekretariat und ein eigenes Budget. Er stellt sein Personal an.</p><p><sup><a name=\"5\">5</a></sup> Der Beauftragte untersteht nicht dem Beurteilungssystem nach Artikel 4 Absatz 3 des Bundespersonalgesetzes vom 24. März 2000.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a26-1\"><sup>1</sup></a> Fassung gemäss Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).<br><a name=\"fn-#a26-2\"><sup>2</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c172_220_1.html\">172.220.1</a></strong></small></p></div></div><a name=\"a26a\" id=\"lawid-5-0-0-0-34\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a26a\"><strong>Art. 26</strong><em>a</em></a><sup><a href=\"#fn-#a26a-1\">1</a></sup><a href=\"index.html#a26a\">Wiederwahl und Beendigung der Amtsdauer</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Verfügt der Bundesrat nicht spätestens sechs Monate vor Ablauf der Amtsdauer aus sachlich hinreichenden Gründen die Nichtwiederwahl, so ist der Beauftragte für eine neue Amtsdauer wiedergewählt.</p><p><sup><a name=\"2\">2</a></sup> Der Beauftragte kann den Bundesrat unter Einhaltung einer Frist von sechs Monaten um Entlassung auf ein Monatsende ersuchen.</p><p><sup><a name=\"3\">3</a></sup> Der Bundesrat kann den Beauftragten vor Ablauf der Amtsdauer des Amtes entheben, wenn dieser:</p><dl compact=\"compact\"><dt>a.</dt><dd>vorsätzlich oder grobfahrlässig Amtspflichten schwer verletzt hat; oder</dd><dt>b.</dt><dd>die Fähigkeit, das Amt auszuüben, auf Dauer verloren hat.</dd></dl><hr><div class=\"fns\"><p><small><a name=\"fn-#a26a-1\"><sup>1</sup></a> Eingefügt durch Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).</small></p></div></div><a name=\"a26b\" id=\"lawid-5-0-0-0-35\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a26b\"><strong>Art. 26</strong><em>b</em></a><sup><a href=\"#fn-#a26b-1\">1</a></sup><a href=\"index.html#a26b\">Andere Beschäftigung</a></h5><div class=\"collapseableArticle\"><p>Der Bundesrat kann dem Beauftragten gestatten, eine andere Beschäftigung auszuüben, wenn dadurch dessen Unabhängigkeit und dessen Ansehen nicht beeinträchtigt werden.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a26b-1\"><sup>1</sup></a> Eingefügt durch Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).</small></p></div></div><a name=\"a27\" id=\"lawid-5-0-0-0-36\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a27\"><strong>Art. 27</strong> Aufsicht über Bundesorgane</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Beauftragte<sup><a href=\"#fn-#a27-1\">1</a></sup> überwacht die Einhaltung dieses Gesetzes und der übrigen Datenschutzvorschriften des Bundes durch die Bundesorgane. Der Bundesrat ist von dieser Aufsicht ausgenommen.</p><p><sup><a name=\"2\">2</a></sup> Der Beauftragte klärt von sich aus oder auf Meldung Dritter hin den Sachverhalt näher ab.</p><p><sup><a name=\"3\">3</a></sup> Bei der Abklärung kann er Akten herausverlangen, Auskünfte einholen und sich Datenbearbeitungen vorführen lassen. Die Bundesorgane müssen an der Feststellung des Sachverhaltes mitwirken. Das Zeugnisverweigerungsrecht nach Artikel 16 des Verwaltungsverfahrensgesetzes<sup><a href=\"#fn-#a27-2\">2</a></sup> gilt sinngemäss.</p><p><sup><a name=\"4\">4</a></sup> Ergibt die Abklärung, dass Datenschutzvorschriften verletzt werden, so empfiehlt der Beauftragte dem verantwortlichen Bundesorgan, das Bearbeiten zu ändern oder zu unterlassen. Er orientiert das zuständige Departement oder die Bundeskanzlei über seine Empfehlung.</p><p><sup><a name=\"5\">5</a></sup> Wird eine Empfehlung nicht befolgt oder abgelehnt, so kann er die Angelegenheit dem Departement oder der Bundeskanzlei zum Entscheid vorlegen. Der Entscheid wird den betroffenen Personen in Form einer Verfügung mitgeteilt.<sup><a href=\"#fn-#a27-3\">3</a></sup></p><p><sup><a name=\"6\">6</a></sup> Der Beauftragte ist berechtigt, gegen die Verfügung nach Absatz 5 und gegen den Entscheid der Beschwerdebehörde Beschwerde zu führen.<sup><a href=\"#fn-#a27-4\">4</a></sup></p><hr><div class=\"fns\"><p><small><a name=\"fn-#a27-1\"><sup>1</sup></a> Ausdruck gemäss Anhang Ziff. 4 des Öffentlichkeitsgesetzes vom 17. Dez. 2004, in Kraft seit 1. Juli 2006 (<a href=\"http://www.admin.ch/ch/d/as/2006/2319.pdf\">AS <strong>2006</strong> 2319</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/1963.pdf\">BBl <strong>2003</strong> 1963</a>). Diese Änd. ist im ganzen Erlass berücksichtigt.<br><a name=\"fn-#a27-2\"><sup>2</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c172_021.html\">172.021</a></strong><br><a name=\"fn-#a27-3\"><sup>3</sup></a> Fassung des zweiten Satzes gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a27-4\"><sup>4</sup></a> Eingefügt durch Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a28\" id=\"lawid-5-0-0-0-37\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a28\"><strong>Art. 28</strong> Beratung Privater</a></h5><div class=\"collapseableArticle\"><p>Der Beauftragte berät private Personen in Fragen des Datenschutzes.</p></div><a name=\"a29\" id=\"lawid-5-0-0-0-38\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a29\"><strong>Art. 29</strong> Abklärungen und Empfehlungen im Privatrechtsbereich</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Beauftragte klärt von sich aus oder auf Meldung Dritter hin den Sachverhalt näher ab, wenn:</p><dl compact=\"compact\"><dt>a.</dt><dd>Bearbeitungsmethoden geeignet sind, die Persönlichkeit einer grösseren Anzahl von Personen zu verletzen (Systemfehler);</dd><dt>b.<sup><a href=\"#fn-#a29-1\">1</a></sup></dt><dd>Datensammlungen registriert werden müssen (Art. 11<em>a</em>);</dd><dt>c.<sup><a href=\"#fn-#a29-2\">2</a></sup></dt><dd>eine Informationspflicht nach Artikel 6 Absatz 3 besteht.</dd></dl><p><sup><a name=\"2\">2</a></sup> Er kann dabei Akten herausverlangen, Auskünfte einholen und sich Datenbearbeitungen vorführen lassen. Das Zeugnisverweigerungsrecht nach Artikel 16 des Verwaltungsverfahrensgesetzes<sup><a href=\"#fn-#a29-3\">3</a></sup> gilt sinngemäss.</p><p><sup><a name=\"3\">3</a></sup> Der Beauftragte kann aufgrund seiner Abklärungen empfehlen, das Bearbeiten zu ändern oder zu unterlassen.</p><p><sup><a name=\"4\">4</a></sup> Wird eine solche Empfehlung des Beauftragten nicht befolgt oder abgelehnt, so kann er die Angelegenheit dem Bundesverwaltungsgericht zum Entscheid vorlegen. Er ist berechtigt, gegen diesen Entscheid Beschwerde zu führen.<sup><a href=\"#fn-#a29-4\">4</a></sup></p><hr><div class=\"fns\"><p><small><a name=\"fn-#a29-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a29-2\"><sup>2</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a29-3\"><sup>3</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c172_021.html\">172.021</a></strong><br><a name=\"fn-#a29-4\"><sup>4</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a30\" id=\"lawid-5-0-0-0-39\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a30\"><strong>Art. 30</strong> Information</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Beauftragte erstattet der Bundesversammlung periodisch sowie nach Bedarf Bericht. Er übermittelt den Bericht gleichzeitig dem Bundesrat. Die periodischen Berichte werden veröffentlicht.<sup><a href=\"#fn-#a30-1\">1</a></sup></p><p><sup><a name=\"2\">2</a></sup> In Fällen von allgemeinem Interesse kann er die Öffentlichkeit über seine Feststellungen und Empfehlungen informieren. Personendaten, die dem Amtsgeheimnis unterstehen, darf er nur mit Zustimmung der zuständigen Behörde veröffentlichen. Verweigert diese die Zustimmung, so entscheidet der Präsident der auf dem Gebiet des Datenschutzes zuständigen Abteilung des Bundesverwaltungsgerichts endgültig.<sup><a href=\"#fn-#a30-2\">2</a></sup></p><hr><div class=\"fns\"><p><small><a name=\"fn-#a30-1\"><sup>1</sup></a> Fassung gemäss Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).<br><a name=\"fn-#a30-2\"><sup>2</sup></a> Fassung des Satzes gemäss Anhang Ziff. 26 des Verwaltungsgerichtsgesetzes vom 17. Juni 2005, in Kraft seit 1. Jan. 2007 (<a href=\"http://www.admin.ch/ch/d/as/2006/2197.pdf\">AS <strong>2006</strong> 2197</a> 1069; <a href=\"http://www.admin.ch/ch/d/ff/2001/4202.pdf\">BBl <strong>2001</strong> 4202</a>).</small></p></div></div><a name=\"a31\" id=\"lawid-5-0-0-0-40\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a31\"><strong>Art. 31</strong> Weitere Aufgaben</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Beauftragte hat insbesondere folgende weiteren Aufgaben:<sup><a href=\"#fn-#a31-1\">1</a></sup></p><dl compact=\"compact\"><dt>a.</dt><dd>Er unterstützt Organe des Bundes und der Kantone in Fragen des Datenschutzes.</dd><dt>b.</dt><dd>Er nimmt Stellung zu Vorlagen über Erlasse und Massnahmen des Bundes, die für den Datenschutz erheblich sind.</dd><dt>c.</dt><dd>Er arbeitet mit in- und ausländischen Datenschutzbehörden zusammen.</dd><dt>d.<sup><a href=\"#fn-#a31-2\">2</a></sup></dt><dd>Er begutachtet, inwieweit die Datenschutzgesetzgebung im Ausland einen angemessenen Schutz gewährleistet.</dd><dt>e.<sup><a href=\"#fn-#a31-3\">3</a></sup></dt><dd>Er prüft die ihm nach Artikel 6 Absatz 3 gemeldeten Garantien und Datenschutzregeln.</dd><dt>f.<sup><a href=\"#fn-#a31-4\">4</a></sup></dt><dd>Er prüft die Zertifizierungsverfahren nach Artikel 11 und kann dazu Empfehlungen nach Artikel 27 Absatz 4 oder 29 Absatz 3 abgeben.</dd><dt>g.<sup><a href=\"#fn-#a31-5\">5</a></sup></dt><dd>Er nimmt die ihm durch das Öffentlichkeitsgesetz vom 17. Dezember 2004<sup><a href=\"#fn-#a31-6\">6</a></sup> übertragenen Aufgaben wahr.</dd></dl><p><sup><a name=\"2\">2</a></sup> Er kann Organe der Bundesverwaltung auch dann beraten, wenn dieses Gesetz nach Artikel 2 Absatz 2 Buchstaben c und d nicht anwendbar ist. Die Organe der Bundesverwaltung können ihm Einblick in ihre Geschäfte gewähren.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a31-1\"><sup>1</sup></a> Fassung gemäss Anhang Ziff. 4 des Öffentlichkeitsgesetzes vom 17. Dez. 2004, in Kraft seit 1. Juli 2006 (<a href=\"http://www.admin.ch/ch/d/as/2006/2319.pdf\">AS <strong>2006</strong> 2319</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/1963.pdf\">BBl <strong>2003</strong> 1963</a>).<br><a name=\"fn-#a31-2\"><sup>2</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a31-3\"><sup>3</sup></a> Eingefügt durch Anhang Ziff. 4 des Öffentlichkeitsgesetzes vom 17. Dez. 2004 (<a href=\"http://www.admin.ch/ch/d/as/2006/2319.pdf\">AS <strong>2006</strong> 2319</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/1963.pdf\">BBl <strong>2003</strong> 1963</a>). Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (AS <strong>2007</strong> 4983; BBl <strong>2003</strong> 2101).<br><a name=\"fn-#a31-4\"><sup>4</sup></a> Eingefügt durch Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a31-5\"><sup>5</sup></a> Eingefügt durch Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).<br><a name=\"fn-#a31-6\"><sup>6</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c152_3.html\">152.3</a></strong></small></p></div></div><a name=\"a32\" id=\"lawid-5-0-0-0-41\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a32\"><strong>Art. 32</strong></a><sup><a href=\"#fn-#a32-1\">1</a></sup><a href=\"index.html#a32\"></a></h5><div class=\"collapseableArticle\"><hr><div class=\"fns\"><p><small><a name=\"fn-#a32-1\"><sup>1</sup></a> Aufgehoben durch Anhang Ziff. I des BG vom 30. Sept. 2011 über die Forschung am Menschen, mit Wirkung seit 1. Jan. 2014 (<a href=\"http://www.admin.ch/ch/d/as/2013/3215.pdf\">AS <strong>2013</strong> 3215</a>; <a href=\"http://www.admin.ch/ch/d/ff/2009/8045.pdf\">BBl <strong>2009</strong> 8045</a>).</small></p></div></div><br></div><a name=\"id-6\" id=\"lawid-6\"></a><h1 class=\"title smallh1\"><span> </span><span> </span><a href=\"index.html#id-6\">6. Abschnitt:</a><sup><a href=\"#fn4\">4</a></sup>  <a href=\"index.html#id-6\">Rechtsschutz</a></h1><div class=\"collapseable\"><a name=\"a33\" id=\"lawid-6-0-0-0-42\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a33\"><strong>Art. 33</strong></a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Rechtsschutz richtet sich nach den allgemeinen Bestimmungen über die Bundesrechtspflege.</p><p><sup><a name=\"2\">2</a></sup> Stellt der Beauftragte bei einer Sachverhaltsabklärung nach Artikel 27 Absatz 2 oder nach Artikel 29 Absatz 1 fest, dass den betroffenen Personen ein nicht leicht wieder gutzumachender Nachteil droht, so kann er dem Präsidenten der auf dem Gebiet des Datenschutzes zuständigen Abteilung des Bundesverwaltungsgerichts vorsorgliche Massnahmen beantragen. Das Verfahren richtet sich sinngemäss nach den Artikeln 79-84 des Bundesgesetzes vom 4. Dezember 1947<sup><a href=\"#fn-#a33-1\">1</a></sup> über den Bundeszivilprozess.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a33-1\"><sup>1</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c273.html\">273</a></strong></small></p></div></div><br></div><a name=\"id-7\" id=\"lawid-7\"></a><h1 class=\"title smallh1\"><span> </span><span> </span><a href=\"index.html#id-7\">7. Abschnitt: Strafbestimmungen</a></h1><div class=\"collapseable\"><a name=\"a34\" id=\"lawid-7-0-0-0-43\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a34\"><strong>Art. 34</strong> Verletzung der Auskunfts-, Melde- und Mitwirkungspflichten</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Mit Busse werden private Personen auf Antrag bestraft:<sup><a href=\"#fn-#a34-1\">1</a></sup></p><dl compact=\"compact\"><dt>a.</dt><dd>die ihre Pflichten nach den Artikeln 8-10 und 14 verletzen, indem sie vorsätzlich eine falsche oder eine unvollständige Auskunft erteilen;</dd><dt>b.</dt><dd>die es vorsätzlich unterlassen: <dl compact=\"compact\"><dt>1.</dt><dd>die betroffene Person nach Artikel 14 Absatz 1 zu informieren, oder</dd><dt>2.</dt><dd>ihr die Angaben nach Artikel 14 Absatz 2 zu liefern.<sup><a href=\"#fn-#a34-2\">2</a></sup></dd></dl></dd></dl><p><sup><a name=\"2\">2</a></sup> Mit Busse werden private Personen bestraft, die vorsätzlich:<sup><a href=\"#fn-#a34-3\">3</a></sup></p><dl compact=\"compact\"><dt>a.<sup><a href=\"#fn-#a34-4\">4</a></sup></dt><dd>die Information nach Artikel 6 Absatz 3 oder die Meldung nach Artikel 11<em>a</em> unterlassen oder dabei vorsätzlich falsche Angaben machen;</dd><dt>b.</dt><dd>dem Beauftragten bei der Abklärung eines Sachverhaltes (Art. 29) falsche Auskünfte erteilen oder die Mitwirkung verweigern.</dd></dl><hr><div class=\"fns\"><p><small><a name=\"fn-#a34-1\"><sup>1</sup></a> Fassung gemäss Art. 333 des Strafgesetzbuches in der Fassung des BG vom 13. Dez. 2002, in Kraft seit 1. Jan. 2007 (<a href=\"http://www.admin.ch/ch/d/as/2006/3459.pdf\">AS <strong>2006</strong> 3459</a>; <a href=\"http://www.admin.ch/ch/d/ff/1999/1979.pdf\">BBl <strong>1999</strong> 1979</a>).<br><a name=\"fn-#a34-2\"><sup>2</sup></a> Fassung gemäss Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).<br><a name=\"fn-#a34-3\"><sup>3</sup></a> Fassung gemäss Art. 333 des Strafgesetzbuches in der Fassung des BG vom 13. Dez. 2002, in Kraft seit 1. Jan. 2007 (<a href=\"http://www.admin.ch/ch/d/as/2006/3459.pdf\">AS <strong>2006</strong> 3459</a>; <a href=\"http://www.admin.ch/ch/d/ff/1999/1979.pdf\">BBl <strong>1999</strong> 1979</a>).<br><a name=\"fn-#a34-4\"><sup>4</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a35\" id=\"lawid-7-0-0-0-44\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a35\"><strong>Art. 35</strong> Verletzung der beruflichen Schweigepflicht</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Wer vorsätzlich geheime, besonders schützenswerte Personendaten oder Persönlichkeitsprofile unbefugt bekannt gibt, von denen er bei der Ausübung seines Berufes, der die Kenntnis solcher Daten erfordert, erfahren hat, wird auf Antrag mit Busse bestraft.<sup><a href=\"#fn-#a35-1\">1</a></sup></p><p><sup><a name=\"2\">2</a></sup> Gleich wird bestraft, wer vorsätzlich geheime, besonders schützenswerte Personendaten oder Persönlichkeitsprofile unbefugt bekannt gibt, von denen er bei der Tätigkeit für den Geheimhaltungspflichtigen oder während der Ausbildung bei diesem erfahren hat.</p><p><sup><a name=\"3\">3</a></sup> Das unbefugte Bekanntgeben geheimer, besonders schützenswerter Personendaten oder Persönlichkeitsprofile ist auch nach Beendigung der Berufsausübung oder der Ausbildung strafbar.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a35-1\"><sup>1</sup></a> Fassung gemäss Art. 333 des Strafgesetzbuches in der Fassung des BG vom 13. Dez. 2002, in Kraft seit 1. Jan. 2007 (<a href=\"http://www.admin.ch/ch/d/as/2006/3459.pdf\">AS <strong>2006</strong> 3459</a>; <a href=\"http://www.admin.ch/ch/d/ff/1999/1979.pdf\">BBl <strong>1999</strong> 1979</a>).</small></p></div></div><br></div><a name=\"id-8\" id=\"lawid-8\"></a><h1 class=\"title smallh1\"><span> </span><span> </span><a href=\"index.html#id-8\">8. Abschnitt: Schlussbestimmungen</a></h1><div class=\"collapseable\"><a name=\"a36\" id=\"lawid-8-0-0-0-45\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a36\"><strong>Art. 36</strong> Vollzug</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Der Bundesrat erlässt die Ausführungsbestimmungen.</p><p><sup><a name=\"2\">2</a></sup> …<sup><a href=\"#fn-#a36-1\">1</a></sup></p><p><sup><a name=\"3\">3</a></sup> Er kann für die Auskunftserteilung durch diplomatische und konsularische Vertretungen der Schweiz im Ausland Abweichungen von den Artikeln 8 und 9 vorsehen.</p><p><sup><a name=\"4\">4</a></sup> Er kann ferner bestimmen:</p><dl compact=\"compact\"><dt>a.</dt><dd>welche Datensammlungen ein Bearbeitungsreglement benötigen;</dd><dt>b.</dt><dd>unter welchen Voraussetzungen ein Bundesorgan Personendaten durch einen Dritten bearbeiten lassen oder für Dritte bearbeiten darf;</dd><dt>c.</dt><dd>wie die Mittel zur Identifikation von Personen verwendet werden dürfen.</dd></dl><p><sup><a name=\"5\">5</a></sup> Er kann völkerrechtliche Verträge über den Datenschutz abschliessen, wenn sie den Grundsätzen dieses Gesetzes entsprechen.</p><p><sup><a name=\"6\">6</a></sup> Er regelt, wie Datensammlungen zu sichern sind, deren Daten im Kriegs- oder Krisenfall zu einer Gefährdung von Leib und Leben der betroffenen Personen führen können.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a36-1\"><sup>1</sup></a> Aufgehoben durch Art. 25 des Archivierungsgesetzes vom 26. Juni 1998 (<a href=\"http://www.admin.ch/ch/d/as/1999/2243.pdf\">AS <strong>1999</strong> 2243</a>; BBl <strong>1997</strong> II 941).</small></p></div></div><a name=\"a37\" id=\"lawid-8-0-0-0-46\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a37\"><strong>Art. 37</strong> Vollzug durch die Kantone</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Soweit keine kantonalen Datenschutzvorschriften bestehen, die einen angemessenen Schutz gewährleisten, gelten für das Bearbeiten von Personendaten durch kantonale Organe beim Vollzug von Bundesrecht die Artikel 1-11<em>a</em>, 16, 17, 18-22 und 25 Absätze 1-3 dieses Gesetzes.<sup><a href=\"#fn-#a37-1\">1</a></sup></p><p><sup><a name=\"2\">2</a></sup> Die Kantone bestimmen ein Kontrollorgan, welches für die Einhaltung des Datenschutzes sorgt. Die Artikel 27, 30 und 31 sind sinngemäss anwendbar.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a37-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BG vom 24. März 2006, in Kraft seit 1. Jan. 2008 (<a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a>; <a href=\"http://www.admin.ch/ch/d/ff/2003/2101.pdf\">BBl <strong>2003</strong> 2101</a>).</small></p></div></div><a name=\"a38\" id=\"lawid-8-0-0-0-47\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a38\"><strong>Art. 38</strong> Übergangsbestimmungen</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Die Inhaber von Datensammlungen müssen bestehende Datensammlungen, die nach Artikel 11 zu registrieren sind, spätestens ein Jahr nach Inkrafttreten dieses Gesetzes anmelden.</p><p><sup><a name=\"2\">2</a></sup> Sie müssen innert einem Jahr nach Inkrafttreten dieses Gesetzes die notwendigen Vorkehren treffen, damit sie die Auskünfte nach Artikel 8 erteilen können.</p><p><sup><a name=\"3\">3</a></sup> Bundesorgane dürfen eine bestehende Datensammlung mit besonders schützenswerten Personendaten oder mit Persönlichkeitsprofilen noch bis am 31. Dezember 2000 benützen, ohne dass die Voraussetzungen von Artikel 17 Absatz 2 erfüllt sind.<sup><a href=\"#fn-#a38-1\">1</a></sup></p><p><sup><a name=\"4\">4</a></sup> Im Asyl- und Ausländerbereich wird die Frist nach Absatz 3 bis zum Inkrafttreten des totalrevidierten Asylgesetzes vom 26. Juni 1998<sup><a href=\"#fn-#a38-2\">2</a></sup> sowie der Änderung des Bundesgesetzes vom 26. März 1931<sup><a href=\"#fn-#a38-3\">3</a></sup> über Aufenthalt und Niederlassung der Ausländer verlängert.<sup><a href=\"#fn-#a38-4\">4</a></sup></p><hr><div class=\"fns\"><p><small><a name=\"fn-#a38-1\"><sup>1</sup></a> Fassung gemäss Ziff. I des BB vom 26. Juni 1998, in Kraft bis 31. Dez. 2000 (AS <strong>1998</strong> 1586; BBl <strong>1998</strong> 1579 1583).<br><a name=\"fn-#a38-2\"><sup>2</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c142_31.html\">142.31</a></strong><br><a name=\"fn-#a38-3\"><sup>3</sup></a> [BS <strong>1</strong> 121; AS <strong>1949</strong> 221, <strong>1987</strong> 1665, <strong>1988</strong> 332, <strong>1990</strong> 1587 Art. 3 Abs. 2, <strong>1991</strong> 362 Ziff. II 11 1034 Ziff. III, <strong>1995</strong> 146, <strong>1999</strong> 1111 2262 Anhang Ziff. 1, <strong>2000</strong> 1891 Ziff. IV 2, <strong>2002</strong> 685 Ziff. I 1 701 Ziff. I 1 3988 Anhang Ziff. 3, <strong>2003</strong> 4557 Anhang Ziff. II 2, <strong>2004</strong> 1633 Ziff. I 1 4655 Ziff. I 1, <strong>2005</strong> 5685 Anhang Ziff. 2, <strong>2006</strong> 979 Art. 2 Ziff. 1 1931 Art. 18 Ziff. 1 2197 Anhang Ziff. 3 3459 Anhang Ziff. 1 4745 Anhang Ziff. 1, <strong>2007</strong> 359 Anhang Ziff. 1. AS <strong>2007</strong> 5437 Anhang Ziff. I]<br><a name=\"fn-#a38-4\"><sup>4</sup></a> Eingefügt durch Ziff. II des BB vom 20. Juni 1997, in Kraft seit 1. Jan. 1998 (AS <strong>1997</strong> 2372; BBl <strong>1997</strong> I 877). Die genannten Gesetze traten am 1. Okt. 1999 in Kraft.</small></p></div></div><a name=\"a38a\" id=\"lawid-8-0-0-0-48\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a38a\"><strong>Art. 38</strong><em>a</em></a><sup><a href=\"#fn-#a38a-1\">1</a></sup><a href=\"index.html#a38a\">Übergangsbestimmung zur Änderung vom 19. März 2010</a></h5><div class=\"collapseableArticle\"><p>Die Wahl des Beauftragten und die Beendigung seines Arbeitsverhältnisses unterstehen bis zum Ende der Legislaturperiode, in der diese Änderung in Kraft tritt, dem bisherigen Recht.</p><hr><div class=\"fns\"><p><small><a name=\"fn-#a38a-1\"><sup>1</sup></a> Eingefügt durch Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).</small></p></div></div><a name=\"a39\" id=\"lawid-8-0-0-0-49\"></a><h5><span class=\"expanderComparator\"> </span><span class=\"context-menu\"> </span><a href=\"index.html#a39\"><strong>Art. 39</strong> Referendum und Inkrafttreten</a></h5><div class=\"collapseableArticle\"><p><sup><a name=\"1\">1</a></sup> Dieses Gesetz untersteht dem fakultativen Referendum.</p><p><sup><a name=\"2\">2</a></sup> Der Bundesrat bestimmt das Inkrafttreten.</p></div><br><p>Datum des Inkrafttretens: 1. Juli 1993<sup><a href=\"#fn5\">5</a></sup></p></div><a name=\"id-trans1\" id=\"lawid-9\"></a><h1 class=\"title smallh1\"><span> </span><span> </span><a href=\"index.html#id-trans1\">Übergangsbestimmung der Änderung vom 24. März 2006</a><sup><a href=\"#fn6\">6</a></sup> <a href=\"index.html#id-trans1\"></a></h1><div class=\"collapseable\"><p>Innert einem Jahr nach Inkrafttreten dieses Gesetzes haben die Inhaber der Datensammlungen die notwendigen Massnahmen zur Information der betroffenen Personen nach Artikel 4 Absatz 4 und Artikel 7<em>a</em> zu ergreifen.</p></div><hr><a name=\"app1\" id=\"lawid-10\"></a><h1 class=\"title smallh1\"><span> </span><span> </span><a href=\"index.html#app1\"><em>Anhang</em></a></h1><div class=\"collapseable\"><a name=\"app1\" id=\"lawid-10-1\"></a><h2 class=\"title\"><span> </span><span> </span><a href=\"index.html#app1\">Änderung von Bundesgesetzen</a></h2><div class=\"collapseable\"><p>…<sup><a href=\"#fn-#app1-1\">1</a></sup></p><hr><div class=\"fns\"><p><small><a name=\"fn-#app1-1\"><sup>1</sup></a> Die Änderungen können unter AS <strong>1993</strong> 1945 konsultiert werden.</small></p></div></div></div><div><a name=\"fuss\"></a><hr><p> AS <strong>1993</strong> 1945</p></div><hr><div class=\"fns\"><p><small><a name=\"fn1\"><sup>1</sup></a> SR <strong><a href=\"http://www.admin.ch/ch/d/sr/c101.html\">101</a></strong><a name=\"fn2\"><sup>2</sup></a> Fassung gemäss Ziff. 3 des BG vom 19. März 2010 über die Umsetzung des Rahmenbeschlusses 2008/977/JI über den Schutz von Personendaten im Rahmen der polizeilichen und justiziellen Zusammenarbeit in Strafsachen, in Kraft seit 1. Dez. 2010 (<a href=\"http://www.admin.ch/ch/d/as/2010/3387.pdf\">AS <strong>2010</strong> 3387</a> 3418; <a href=\"http://www.admin.ch/ch/d/ff/2009/6749.pdf\">BBl <strong>2009</strong> 6749</a>).<a name=\"fn3\"><sup>3</sup></a> BBl <strong>1988</strong> II 413<a name=\"fn4\"><sup>4</sup></a> Fassung gemäss Anhang Ziff. 26 des Verwaltungsgerichtsgesetzes vom 17. Juni 2005, in Kraft seit 1. Jan. 2007 (<a href=\"http://www.admin.ch/ch/d/as/2006/2197.pdf\">AS <strong>2006</strong> 2197</a> 1069; <a href=\"http://www.admin.ch/ch/d/ff/2001/4202.pdf\">BBl <strong>2001</strong> 4202</a>).<a name=\"fn5\"><sup>5</sup></a> BRB vom 14. Juni 1993<a name=\"fn6\"><sup>6</sup></a><a href=\"http://www.admin.ch/ch/d/as/2007/4983.pdf\">AS <strong>2007</strong> 4983</a></small></p></div><hr> <div id=\"comparison\" class=\"modal\"></div>
</div>
  <div class="json-input">
    <div id="json-panel-left">
      <label for="json-input-left">
        <h2>JSON Left</h2>
      </label>
      <button class="prettyfy" type="button" title="Pretty print">{ }</button>
      <input id="url-input-left" type="text" name="left" style="width: 100%" value="products.json"><br>
        <textarea id="json-input-left">
        loading...
      </textarea>
        <span class="error-message"></span>
    </div>
    <div id="json-panel-right">
      <label for="json-input-right">
        <h2>JSON Right</h2>
      </label>
      <button class="prettyfy" type="button" title="Pretty print">{ }</button>
      <input id="url-input-right" type="url" name="right" style="width: 100%" value="products.json"><br>
        <textarea id="json-input-right">
        loading...
      </textarea>
        <span class="error-message"></span>
    </div>
  </div>
  <div id="results">
    <label style="display: none;">
      <input id="show-delta-type-visual" type="radio" name="delta-type" checked>Visual
    </label>
    <label style="display: none;">
      <input id="show-delta-type-json" type="radio" name="delta-type">JSON
    </label>
    <label style="display: none;">
      <input id="show-delta-type-annotated" type="radio" name="delta-type">JSON (Annotated)
    </label>
    <div id="delta-panel-visual">
      <div class="header-options">
        <input id="showunchanged" type="checkbox">
          <label for="showunchanged">
            Show unchanged values
          </label>
      </div>
      <p id="visualdiff">
      </p>
    </div>
    <div id="delta-panel-annotated" style="display: none;">
      <p id="annotateddiff">
      </p>
    </div>
    <div id="delta-panel-json" style="display: none;">
      <p>
        (<span id="jsondifflength"></span>
        KB)
      </p>
      <textarea id="json-delta" readonly>
      </textarea>
      <span class="error-message"></span>
    </div>
  </div>
  <script type="text/javascript" src="diff.js"></script>
</body>

</html>

<script>
  $( document ).ready(function()
  {
    $("#json-panel-right").hide();
    $("#json-panel-left").hide();

    $('#show').click(function() {
    $("#documentshow").toggle();

  });
  });
</script>


