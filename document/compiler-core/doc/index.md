
## 目录
本次介绍的是 *compile-core* 目录


## 前置

### 1、ast抽象语法树
源代码的一种树形结构，以树形结构表示语法结构

这是一个简略版的js的ast，（删除了每个节点的start&end等属性）
```js
const code = 'aqara'

{
  type: '程序',
  body: [{
    type: '变量声明',
    declarations: [{
      type: '变量声明',
      id: {
        type: '标识符',
        name: 'code'
      },
      init: {
        type: '字面量',
        value: 'aqara',
        raw: "'aqara'"
      }
    }],
    kind: 'const'
  }]
}
```


### 2、template
就是我们日常写在.vue的template
```js
const template = `<div>hello</div>`
```

### 3、node
就是我们template解析之后，生成的ast，因为ast就是我们node的最直观体现
```js
const ast = { 
  type: 1,
  tag: 'div',
  children: [{ 
    type: 2, 
    content: 'hello', 
  }]
}
```

### 4、code
拼接生成的render代码
```js
const code = `
  export default function render() {
      const _ctx = this
      return null
  }
`
```

### 5、TextModes
文本模式，这会影响到AST判断何时解析完了一个tag的子节点

> 解析完了一个tag：解析到 | 位置


```html
<div class="aqara" >|</div>
<aqara-component :data="lists" />|
```

DATA：就是我们常见的标签；

RCDATA，RAWTEXT：textarea，style，class标签

```html
<h1><div>DATA..</h1>...

<h1>           
    <div>
        DATA..</h1> | 有祖先与之匹配，结束
    </div>
</h1>

<div><textarea>RCDATA，RAWTEXT</div>...

<h1>
    <textarea>
        RCDATA，RAWTEXT</div>... | 会一直等待与</textarea匹配
    </textarea>
</h1>
```

### 6、偏移量
ast里面的loc属性，即表示代码在结构体里面的行、列、长度
```js
const ast = parse(
  `<div :class="{ some: condition }">\n` +            //   0  - 34
    `  <p v-bind:style="{ color: 'red' }"/>\n` +      //   35 - 73 
    `  <!-- a comment with <html> inside it -->\n` +  //   74 - 116
    `</div>`                                          //  117 - 123
)
{
  "column":14,  // x坐标，第几竖行
  "line":1,     // y左边，第几横列
  "offset":13   // 长度，相对于parse的开始
}
```

### 7、空白字符
这里的描述统一代指：换行、换页、空格、换行、制表符等（看上去是空白的）。我们可以通过正则判断他们
```js
/\t\r\n\f /
```


### 8、转义序列
像下面这种奇奇怪怪的字符，我们直接在html中输出，就能显示出符号和中文
```js
&       &nbsp; &dollar;     预先定义好的   空格和$
&#x     &#x4e2d;&#x56fd;    十六进制      中国
&#      &#20013;&#22269;    十进制        中国
```


### 9、正则.exec()
返回匹配到的类数组，array[0]是匹配带的字符串，后面依次是返回匹配到的字串
```js
/(\d+)([a-z]+)(\d+)/.exec('123abc88')

["123abc88", "123", "abc", "88", index: 0, input: "123abc88", groups: undefined]
```


### 10、v-pre
用来判断是否跳过编译，在下面的代码中inPre用来标示自己是否在含有v-pre的组件中
```html
<aqara-component v-pre>
  <component></component>
  ...
</aqara-component>
```





## 目录结构
|  文件   | 内容  | 作用 |
|  :-  | :-  | :- |
| ast.ts        | 定义了一些常量，枚举值，接口类型等        | - |
| parse.ts      | template -> node    | 将模板字符串转换成 ast |
| codegen.ts    | node -> code        | 将生成的ast转换成 render 字符串 |
| transform.ts  | node -> code        | 处理ast中特有语法，v-if v-on等 |
| complie.ts    | template -> code | baseCompile |
| codeframe.ts  | 生成代码片段 | 用于错误提示 |
| errors.ts     | - | 错误码 |
| runtimeHelpers.ts  | - | - |
| utils.ts      | -   | 工具类 |

template -> node和简单的node -> code


### parse.js
这是一个最简单的递归，正常情况下就是
```js
const template = `<div class="text"></div>`

function parse() {
  return {
    type: NodeTypes.ROOT,
    children: function parseChildren() {
        function parseElement() {
          function parseChildren(){
            // 就是这样的一个递归完成dom树解析
          }
        }
      }
      return element
    }
  }
}
```

### 代码

parse
```js
function parse(content, options = {}) {
  // 代码会保存在source.content中
  // 每次我们解析完，就会把解析过得template裁掉
  // 使用的方法是advanceBy
  const context = createParserContext(content, options)
}

advanceBy(context, length)
```

parseChildren
```js
function parseChildren( context, mode, ancestors ) {
  // isEnd判断孩子都解析完成没
  while (!isEnd(context, mode, ancestors)) {
    else if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
    } else if (/[a-z]/i.test(s[2])) {
      // 匹配到</a-z 这种情况是不会存在的，这样的就是错的
    }
  }
  pushNode(nodes, node) //
  return nodes // 返回的孩子节点
}
```


parseElement
```js
function parseElement(context, ancestors) {
  const element = parseTag(context, TagType.Start, parent)
  // 这样在parseChildren里面就能访问到他的祖先
  ancestors.push(element)
  // parseChildren，这里就是一个递归
  const children = parseChildren(context, mode, ancestors)
  // 一定是要parseChildren结束了，这个祖先才会出队
  ancestors.pop()
}
```


parseTag
```js
function parseTag(context, type, parent) {
  // </div>
  // <div
  // <aqara-component/>
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  // 反向字符集
  advanceBy(context, match[0].length)
  // tag取到，截去
  let props = parseAttributes(context, type)
} 
```


parseAttributes
```js
// 此时的context.source已经没有标签了
function parseAttributes(context, type) {
  while (!startsWith(context.source, '>') && !startsWith(context.source, '/>')) {
    const attributeNames = new Set()
    const attr = parseAttribute(context, attributeNames)
  }
}
```

parseAttribute

```js
function parseAttribute(context, nameSet) {
  // disabled
  // :list="lists"
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  if (nameSet.has(name)) {
    // Set的用法，从源码里看到会比从文档里面看到更好
    emitError(context, ErrorCodes.DUPLICATE_ATTRIBUTE)
  }
  nameSet.add(name)
  if (name[0] === '=') {
    emitError(context, ErrorCodes.UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME)
  }
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context)
    advanceBy(context, 1)
    advanceSpaces(context)
    value = parseAttributeValue(context)
    if (!value) {
      emitError(context, ErrorCodes.MISSING_ATTRIBUTE_VALUE)
    }
  }
}
```


parseAttributeValue
```js
function parseAttributeValue(context){
  if (isQuoted) {
    content = parseTextData(context, endIndex, TextModes.ATTRIBUTE_VALUE)
  } else {
    content = parseTextData(context, match[0].length, TextModes.ATTRIBUTE_VALUE)
  }
}
```


parseTextData
```js
function parseTextData(context, length, mode) {
  // 这里就是匹配转义序列的
  // 即我们写 name="&#x4e2d;&#x56fd;"是没问题的
  const head = /&(?:#x?)?/i.exec(context.source)
  if (!head || context.offset + head.index >= end) {

  }
  return text
}
```





### 结尾
1、函数关心返回值，没有返回值的函数，肯定会改变参数（每一次context的解析，都会对context剪裁）；

2、抛出的异常（对转义序列的处理的，我们只需要看他抛出了什么异常，大概知道他干了什么）；

3、typescript对我们阅读代码有很大帮助，常量，接口，枚举值等都很容易看；

4、可以看看单元测试，能帮助我们理解代码，学习别人代码的写法；

5、可能看到很多代码，我们也不会有什么“实质”收获，但是对于我们每天都在用的东西，心里有底也是不错的；

6、至少大家（可能）对parse解析过程有了一个认识；

7、有空再看了别的目录分享给大家；
