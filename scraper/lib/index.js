const util = require('util')
const fs = require('fs')
const writeAsync = util.promisify(fs.writeFile)
const cachios = require('cachios')
const _ = require('lodash')

const cheerioLoad = text => cheerio.load(text, { decodeEntities: false })
const save = srNumber => {
  const id = _.uniqueId(srNumber)
  return data => {
    writeAsync(`./data/${id}.html`, data, 'utf-8')
      .catch(console.error)
    return data // proxy thru
  }
}

module.exports = {
  cheerioLoad,
  save,
}