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


const bayes = require('syzer-level-naive-bayes')
const level = require('level')
const titles = level('')
const nb = bayes(db) // where db is a levelup instance

nb.train('positive', 'amazing, awesome movie!! Yeah!! Oh boy.', function() {
  nb.train('positive', 'this is incredibly, amazing, perfect, great!', function() {
    nb.train('negative', 'terrible, shitty thing. Damn. Sucks!!', function() {
      nb.classify('awesome, cool, amazing!! Yay.', function(err, category) {
        console.log('category is '+category)
      })
    })
  })
})

var thingsToDo = [
  nb.trainAsync('positive', 'Sweet, this is incredibly, amazing, perfect, great!!'),
  nb.trainAsync('positive', 'amazing, awesome movie!! Yeah!! Oh boy.'),
  nb.trainAsync('negative', 'terrible, shitty thing. Damn. Sucks!!')
];

q.all(thingsToDo)
  .then(function () {
    return nb.classifyAsync('awesome, cool, amazing!! Yay.')
  })
  .then(function (category) {
    console.log(category, 'should be positive')
  })

console.log(employmentData)
