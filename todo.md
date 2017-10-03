# TODO

- [X] `admin.ch` extract data for dsg and 
- [X] `admin.ch` extract data for employement
- [X] build classifier for employment/dsg/all others
- [ ] discover new items on the `admin.ch` (Christian)
- [X] frontend, screens:
    - [X] login / signup
    - [.] notification AKA email ('by sbb')
    - [.] diff of docs
- [ ] notification server
- [ ] news update AKA RSS
- [ ] presentation

# stuff that didn't work
 - pdf is not semantic so it looses data about H1/
 - https://github.com/vslavik/diff-pdf will only compare graphically ( so it wont work)


# sfuff that we didnt have time
- connect data sources
    - court rulings
    - EU law
    - blogs
- extract tags about article (ex topic extraction)

```js
// TODO https://www.admin.ch/opc/search/?text=SR+822.111&source_lang=de&language%5B%5D=de&product%5B%5D=ClassifiedCompilation&lang=de
const tags = `
<div id="tags" style="display:none">
  <ul>
  <li><a href='#' >SR 822.111</a></li>`

// TODO extract this
// Beschluss	20. März 2001 =>  decision	20 March 2001
// Inkrafttreten	1. April 2001 => Come into effect	1 April 2001
// Quelle	AS 2001 935 => source	AS 2001 935
// Chronologie	Chronologie => chronology	chronology
// Änderungen	Änderungen => amendments	amendments


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
````
    
