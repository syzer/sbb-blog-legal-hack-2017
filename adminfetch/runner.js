const fetch = require('./index.js')

// initially get all:
let lastModified = new Date(1970, 1, 1)

fetch(lastModified)
  .then((newLastModified) => {
    lastModified = newLastModified
    console.log('done', lastModified)
  })

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
// Promise.all(exampleSrsFetchedToday.map(extract))
//   .then(console.log)

module.exports = {
  exampleSrsFetchedToday
}