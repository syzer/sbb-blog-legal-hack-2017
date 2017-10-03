const fs = require('fs')
const promisify = require('util').promisify
const readFileAsync = promisify(fs.readFile)

const { dsg, employment } = require('../scraper/adminCh/interestingSr')

const dsgFiles = dsg.map(sr => require(`../scraper/data/dsg/${sr}.json`))
const dsgData = dsgFiles.map(({title, preamble}) => ({
  title,
  preamble
}))

const employmentFiles = employment.map(sr => require(`../scraper/data/json/${sr}.json`))
const employmentData = employmentFiles.map(({title, preamble}) => ({
  title,
  preamble
}))



console.log(employmentData)
