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
