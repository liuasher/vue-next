

### 代码

用于生成错误信息并且打印出错误原因和错误行数

```js
var range = 2;
function generateCodeFrame(source, start, end) {
  // 按照行拆开
  const lines = source.split(/\r?\n/)
  let count = 0
  const res = []
  // 每一行遍历
  for (let i = 0; i < lines.length; i++) {
    // 索引累加
    count += lines[i].length + 1  
    // 走到开始缩影那一行的时候
    if (count >= start) {
      
      for (let j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length) continue
        res.push(
          `${j + 1}${' '.repeat(3 - String(j + 1).length)}|  ${lines[j]}`
        )
        const lineLength = lines[j].length
        if (j === i) {
          // push underline
          const pad = start - (count - lineLength) + 1
          const length = end > count ? lineLength - pad : end - start
          res.push(`   |  ` + ' '.repeat(pad) + '^'.repeat(length))
        } else if (j > i) {
          if (end > count) {
            const length = Math.min(end - count, lineLength)
            res.push(`   |  ` + '^'.repeat(length))
          }
          count += lineLength + 1
        }
      }
      break
    }

  }
  return res.join('\n')
}
```

### 作用

```js
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
// <div>
//   <template key="one"></template>
//   <ul>
//     <li v-for="foobar">hi</li>
//   </ul>


const forStart = source.indexOf(`v-for=`)
const forEnd = forStart + `v-for="foobar"`.length
// <template key="one"></template>
// <ul>
//   <li v-for="foobar">hi</li>
// </ul>
// <template key="two"></template>


const keyStart = source.indexOf(`key="two"`)
const keyEnd = keyStart + `key="two"`.length
//   <li v-for="foobar">hi</li>
//   </ul>
//   <template key="two"></template>
// </div>
```

