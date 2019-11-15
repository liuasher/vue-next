const { generateCodeFrame } = require('../js/compiler-core/src/codeframe')

const source = `
  <div>
    <template key="one"></template>
    <ul>
      <li v-for="foobar">hi</li>
    </ul>
    <template key="two"></template>
  </div>
`.trim()

const keyStart = source.indexOf(`key="one"`)
const keyEnd = keyStart + `key="one"`.length
console.log('>  No:1 ', '\n')
console.log(generateCodeFrame(source, keyStart, keyEnd))


const forStart = source.indexOf(`v-for=`)
const forEnd = forStart + `v-for="foobar"`.length
console.log('>  No:2 ', '\n')
console.log(generateCodeFrame(source, forStart, forEnd))


const keyStart1 = source.indexOf(`key="two"`)
const keyEnd1 = keyStart1 + `key="two"`.length
console.log('>  No:3 ', '\n')
console.log(generateCodeFrame(source, keyStart1, keyEnd1))
