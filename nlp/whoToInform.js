const fs = require('fs')
const promisify = require('util').promisify
const readFileAsync = promisify(fs.readFile)

const { dsg, employment } = require('../scraper/adminCh/interestingSr')

const dsgFiles = dsg.map(sr => require(`../scraper/data/dsg/${sr}.json`))
const dsgData = dsgFiles.map(({ title, preamble }) => ({
  title,
  preamble
}))

const employmentFiles = employment.map(sr => require(`../scraper/data/json/${sr}.json`))
const employmentData = employmentFiles.map(({ title, preamble }) => ({
  title,
  preamble
}))


const bayes = require('syzer-level-naive-bayes')
const level = require('level')
const titles = level('./data/titles')
const preambles = level('./data/preambles')
const nb1 = bayes(titles) // where db is a levelup instance
const nb2 = bayes(preambles) // where db is a levelup instance

const titlesClassifier = dsgData
  .map(({ title }) => title)
  .map(e => nb1.trainAsync('dsg', e))
  .concat(
    employmentData
      .map(({ title }) => title)
      .map(e => nb1.trainAsync('employment', e)))

const preambleClassifier = dsgData
  .map(({ preamble }) => preamble)
  .map(e => nb2.trainAsync('dsg', e))
  .concat(
    employmentData
      .map(({ preamble }) => preamble)
      .map(e => nb2.trainAsync('employment', e)))

// test title
const textToClassify = 'Verordnung über die Beseitigung von Benachteiligungen von Menschen mit Behinderungen'
Promise.all(titlesClassifier, preambleClassifier)
  .then(() => Promise.all([
    nb1.classifyAsync(textToClassify),
    nb2.classifyAsync(textToClassify)
  ]))
    .then(([cat1, cat2]) => {
      console.log(cat1, 'should be employment')
      // console.log(cat2, 'should be employment')
    })

console.log(employmentData)
