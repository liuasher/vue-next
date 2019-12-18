
## 文件内容
*parse* 这个文件的作用是把 *template* 转化成 *ast*

--- 

### ？？？
symbole

/()/.exec()

assert(/^[^\t\r\n\f />]/.test(context.source)) 用法

一些很裹人代码的写法 if else

善用set，可读性更好

单元测试

## 前置内容

### 0、节点类型

### 1、TextModes
```ts
export const enum TextModes {
  //          | Elements | Entities | End sign              | Inside of
  DATA, //    | ✔       | ✔       | End tags of ancestors |
  RCDATA, //  | ✘       | ✔       | End tag of the parent | <textarea>
  RAWTEXT, // | ✘       | ✘       | End tag of the parent | <style>,<script>
  CDATA,
  ATTRIBUTE_VALUE
}
```

### 3、偏移量
这次对loc的计算细节不做过多解说，里面涉及一些方法还没看
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

### 4、空白字符
这里的描述统一代指：换行、换页、空格、换行、制表符等（开上去是空白的）。我们可以通过正则判断他们
```js
/\t\r\n\f /
```

### 5、转义序列
下面这些就是转义序列
- & &nbsp; &dollar;   预先定义好的  空格和$
- &#x &#x4e2d;&#x56fd;  十六进制  中国
- &# &#20013;&#22269;  十进制    中国

### 6、exec & (?:)
返回匹配到的类数组，注意返回类型

### 7、advanceBy
从头剪去length长度的字符串

### 8、Symbol的用法
对于维护一个模块的变量和方法

### 9、注意每一个方法的入参与返回值
typescript很好的做到了这点

### 9、AST抽象语法树
是源代码语法结构的一种抽象表示。它以树状的形式表现编程语言的语法结构，树上的每个节点都表示源代码中的一种结构
```js
const name = 'aqara'
const ast = {
  "type": "Program",
  "start": 0,
  "end": 20,
  "body": [{
    "type": "VariableDeclaration",
    "start": 0,
    "end": 20,
    "declarations": [{
      "type": "VariableDeclarator",
      "start": 6,
      "end": 20,
      "id": {
        "type": "Identifier",
        "start": 6,
        "end": 10,
        "name": "name"
      },
      "init": {
        "type": "Literal",
        "start": 13,
        "end": 20,
        "value": "aqara",
        "raw": "'aqara'"
      }
    }],
    "kind": "const"
  }],
  "sourceType": "module"
}
```

### 10、v-pre | inPre 用来判断是否跳过编译
v-pre skip compilation for this element and all its children. 
- You can use this for displaying raw mustache tags. 
- skipping large numbers of nodes with no directives on them can also speed up compilation.

- 用来显示{{ msg }}插值标签
- 通过跳过大量没有指令的节点，来降低编译时间

```html
<div v-pre></div>
```

### 11、递归
这是一个简单都模拟
```js
const template = `<div class="text"></div>`

function parse() {
  return {
    type: NodeTypes.ROOT,
    children: function parseChildren() {
      // <div class="text"></div>
      while ('父标签没有结束') {
        // <d的情况
        function parseElement() {
          // <div class="text"></div>
          const element = function parseTag() {
            //  class="text"></div>
            function parseAttributes() {
              const props = []
              while ('没有遍历到> | />') {
                const attr = function parseAttribute(){}
                props.push(attr)
              }
              // "</div>
            }
            // "</div>
          }
          
          // "</div>
         
        }
        // 其他的情况...
      }
      // 如果结束了
      if(){
        parseTag()
      }
      // 这样就完成了一个节点都处理
      return element
    }
  }
}
```
```html
<div></div>


<div>
  <div></div>
  <comp/>
</div>
```

--- 

## 关注函数的返回值，如果没有返回值，那肯定会对参数做一些操作

## 如果有抛出异常，能够帮助我们更好地理解代码

## 一些关注度高的开源代码可读性还是很高的，

## 单元测试
这里我们传入一个template解析，比较简单
```js
const ast = parse(
  `<div :class="{ some: condition }">\n` +
    `  <p v-bind:style="{ color: 'red' }"/>\n` +
    `  <!-- a comment with <html> inside it -->\n` +
    `</div>`
)

function parse(content, options = {}) {
  const context = createParserContext(content, options)
  const start = getCursor(context)

  return {
    type: NodeTypes.ROOT,
    children: parseChildren(context, TextModes.DATA, []),
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
    codegenNode: undefined,
    loc: getSelection(context, start)
  }
}
```

--- 

## 涉及的方法

### defaultParserOptions
一些默认的解析参数（参数含义？）

```js
const defaultParserOptions = {
  delimiters: [`{{`, `}}`], // 分隔符
  getNamespace: () => Namespaces.HTML,
  getTextMode: () => TextModes.DATA,
  isVoidTag: NO,  
  isPreTag: NO,
  isCustomElement: NO,
  namedCharacterReferences: {
    'gt;': '>',
    'lt;': '<',
    'amp;': '&',
    'apos;': "'",
    'quot;': '"'
  }
}
```


### createParserContext(content, options)
建立解析的上下文，因为我们没有传入options，其实就是返回了一个context结构

```js
const context = createParserContext(content, options)

function createParserContext( content, options ){
  return {
    options: {
      ...defaultParserOptions,
      ...options
    },
    column: 1,
    line: 1,
    offset: 0,
    originalSource: content,
    source: content,
    maxCRNameLength: Object.keys(
      defaultParserOptions.namedCharacterReferences
    ).reduce((max, name) => Math.max(max, name.length), 0),
    inPre: false
  }
}
```


### getCursor(context)
返回传入上下文的 *loc*，看着好像挺简单 （ 什么是loc？？？）

```js
const start = getCursor(context)
function getCursor(context) {
  const { column, line, offset } = context
  return { column, line, offset }
}
```


### parseChildren(context, TextModes.DATA, [])
一次解析完一个<div> <div/>
```js
function parseChildren( context, mode, ancestors ) {
  const parent = last(ancestors)
  const ns = parent ? parent.ns : Namespaces.HTML
  const nodes = []

  // 当context.source
  // 不是以祖先元素的闭标签开头，仅仅是第一次进来的时候判断
  while (!isEnd(context, mode, ancestors)) {

    

    /** @param {<div :class="{ some: condition }">\n  <p v-bind:style="{ color: \'red\' }"/>\n  <!-- a comment with <html> inside it -->\n</div>} */
    /** @param {\n  <p v-bind:style="{ color: \'red\' }"/>\n  <!-- a comment with <html> inside it -->\n</div>} */
    /** @param {<p v-bind:style="{ color: \'red\' }"/>\n  <!-- a comment with <html> inside it -->\n</div>} */
    /** @param {\n  <!-- a comment with <html> inside it -->\n</div>} */
    /** @param {<!-- a comment with <html> inside it -->\n</div>} */
    /** @param {\n</div>} */


    __DEV__ && assert(context.source.length > 0)
    const s = context.source
    let node = undefined

    if (!context.inPre && startsWith(s, context.options.delimiters[0])) {
      // 以'{{'开头
      // '{{' 插值相关
      node = parseInterpolation(context, mode)
    } else if (mode === TextModes.DATA && s[0] === '<') {
      // 如果是DATA类型 && 以<开头
      if (s.length === 1) {
        // 如果只有一个<，抛出异常EOF_BEFORE_TAG_NAME
        emitError(context, ErrorCodes.EOF_BEFORE_TAG_NAME, 1)
      } else if (s[1] === '!') {
        // 如果是<!
        if (startsWith(s, '<!--')) {
          // 如果是<!--，就当做注释解析
          node = parseComment(context)
        } else if (startsWith(s, '<!DOCTYPE')) {
          // 如果是<!DOCTYPE，解析
          node = parseBogusComment(context)
        } else if (startsWith(s, '<![CDATA[')) {
          // 如果是<![CDATA[，解析
          if (ns !== Namespaces.HTML) {
            // 如果ns不是html，则当做CDATA方式解析
            node = parseCDATA(context, ancestors)
          } else {
            // 如果ns是html，抛出异常CDATA_IN_HTML_CONTENT
            emitError(context, ErrorCodes.CDATA_IN_HTML_CONTENT)
            // parseBogusComment ？？？？
            node = parseBogusComment(context)
          }
        } else {
          // 如果是<!，却又不是以上情况，抛出异常INCORRECTLY_OPENED_COMMENT
          emitError(context, ErrorCodes.INCORRECTLY_OPENED_COMMENT)
          node = parseBogusComment(context)
        }
      } else if (s[1] === '/') {
         // 如果是</
        if (s.length === 2) {
          // 如果只有</
          emitError(context, ErrorCodes.EOF_BEFORE_TAG_NAME, 2)
        } else if (s[2] === '>') {
          // 如果是</>
          emitError(context, ErrorCodes.MISSING_END_TAG_NAME, 2)
          // 剔除了</>
          advanceBy(context, 3)
          continue
        } else if (/[a-z]/i.test(s[2])) {
          // 如果是</a </B，抛出异常
          emitError(context, ErrorCodes.X_INVALID_END_TAG)
          parseTag(context, TagType.End, parent)
          continue
        } else {
          // </后面不是字符，抛出异常
          emitError(context, ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME, 2)
          node = parseBogusComment(context)
        }
      } else if (/[a-z]/i.test(s[1])) {
        // 如果是<a <B，就解析元素
        // 注意，这里就会形成递归
        node = parseElement(context, ancestors)
      } else if (s[1] === '?') {
        // 如果是<?，抛出异常
        emitError(
          context,
          ErrorCodes.UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME,
          1
        )
        node = parseBogusComment(context)
      } else {
        // 如果是<& <*等奇奇怪怪的，抛出异常
        emitError(context, ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME, 1)
      }
    }

    // 到此，我们跑完了上面的一波if else

    // 如果这样了都还没node，那就parseText
    if (!node) {
      node = parseText(context, mode)
    }
    
    // 如果node是一个数组（什么情况下会是一个数组？）
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        pushNode(nodes, node[i])
      }
    } else {
      pushNode(nodes, node)
    }
  }
  // 到这里，我们就得到了一个nodes数组


  // Whitespace management for more efficient output
  // (same as v2 whitespance: 'condense')
  let removedWhitespace = false
  if (!parent || !context.options.isPreTag(parent.tag)) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node.type === NodeTypes.TEXT) {
        if (!node.content.trim()) {
          const prev = nodes[i - 1]
          const next = nodes[i + 1]
          // If:
          // - the whitespace is the first or last node, or:
          // - the whitespace is adjacent to a comment, or:
          // - the whitespace is between two elements AND contains newline
          // Then the whitespace is ignored.
          if (
            !prev ||
            !next ||
            prev.type === NodeTypes.COMMENT ||
            next.type === NodeTypes.COMMENT ||
            (prev.type === NodeTypes.ELEMENT &&
              next.type === NodeTypes.ELEMENT &&
              /[\r\n]/.test(node.content))
          ) {
            removedWhitespace = true
            nodes[i] = null
          } else {
            // Otherwise, condensed consecutive whitespace inside the text down to
            // a single space
            node.content = ' '
          }
        } else {
          node.content = node.content.replace(/\s+/g, ' ')
        }
      }
    }
  }

  return removedWhitespace ? nodes.filter(node => node !== null) : nodes
}
```


### isEnd
判断source是否结束（什么叫结束？）

- TextModes.DATA: source如果以祖先元素的闭标签开头
- TextModes.RCDATA: 
- TextModes.RAWTEXT: source如果以之前元素的闭标签开头
- TextModes.CDATA: source如果以]]>开头

> 这里我们要对ancestors换个理解，因为我们解析模板是当做string从到尾
> 所以我们不能当成树形结构去理解，而是当做一维的去理解
> 祖先就是之前的，父亲就是紧邻的
？？？？？

```js
const template = `<div>
  <span>
    <h1></h1>
    <h2></h2>
    <h3></h3>
  </span>
</div>`
```

```js
function isEnd( context, mode, ancestors ) {
  const s = context.source
  
  switch (mode) {
    case TextModes.DATA:
      //  如果source以</开头
      if (startsWith(s, '</')) {
        for (let i = ancestors.length - 1; i >= 0; --i) {
          // 根据我们都理解，遍历之前的tag
          // 遍历祖先，如果source以先祖的</tag结束
          if (startsWithEndTagOpen(s, ancestors[i].tag)) {
            return true
          }
        }
      }
      break

    case TextModes.RCDATA:
    case TextModes.RAWTEXT: {
      const parent = last(ancestors)
      // 取出父亲，如果有父亲，且以父亲的</tag结束
      if (parent && startsWithEndTagOpen(s, parent.tag)) {
        // 根据我们的理解，遍历前一个tag
        return true
      }
      break
    }

    case TextModes.CDATA:
      //  <![CDATA[文本内容]]> xml解析规范
      //  CDATA不能嵌套CDATA
      if (startsWith(s, ']]>')) {
        return true
      }
      break
  }

  return !s
}
```


### startsWithEndTagOpen
判断source结尾满足一下情况：
1、开头是 </tag
2、tag后面跟的是tab、换行、换页、空格、>

即以闭标签开头，标签可以打开或者闭合
```js
function startsWithEndTagOpen(source, tag) {
  return (
    // 如果以</开头
    startsWith(source, '</') &&
    // 如果</后面跟的标签，等于tag
    source.substr(2, tag.length).toLowerCase() === tag.toLowerCase() &&
    // 如果tag之后跟着的是（tab、换行、换页、空格、>）
    /[\t\n\f />]/.test(source[2 + tag.length] || '>')
  )
}
```


### advanceBy(context, 3)
先我们一个log，就是从头截取

```js
// 16
const before = `{ color: \'red\' }"/>\n  <!-- a comment with <html> inside it -->\n</div>`
const after  = `"/>\n  <!-- a comment with <html> inside it -->\n</div>`

```

```js
function advanceBy(context, numberOfCharacters) {
  const { source } = context
  // 改变position
  advancePositionWithMutation(context, source, numberOfCharacters)
  // 从numberOfCharacters开始，截取后面都字符串
  context.source = source.slice(numberOfCharacters)
}

function advancePositionWithMutation(pos, source, numberOfCharacters = source.length) {
  let linesCount = 0
  let lastNewLinePos = -1
  // 
  for (let i = 0; i < numberOfCharacters; i++) {
    // String.fromCharCode(10) "↵"
    if (source.charCodeAt(i) === 10 /* newline char code */) {
      linesCount++
      lastNewLinePos = i
    }
  }

  pos.offset += numberOfCharacters
  pos.line += linesCount
  pos.column =
    lastNewLinePos === -1
      ? pos.column + numberOfCharacters
      : Math.max(1, numberOfCharacters - lastNewLinePos)

  return pos
}
```


### 这里是一些在parseChildren中，使用的方法

- parseBogusComment
？？？

- parseComment(context)
source以 </!-- 开始
```js
function parseComment(context) {

  const start = getCursor(context)
  let content

  // Regular comment.
  // /--(\!)?>/.exec('<!-- xxx -->')   ["-->", undefined, index: 9, input: "<!-- xxx -->", groups: undefined]
  // /--(\!)?>/.exec('<!-- xx !-->')   ["-->", undefined, index: 9, input: "<!-- xx !-->", groups: undefined]
  
  // /--(\!)?>/.exec('<!-- xxx --')  null 
  // /--(\!)?>/.exec('<!-- xxx -')  null
  // /--(\!)?>/.exec('<!--->')  ["-->", undefined, index: 3, input: "<!--->", groups: undefined]
  // /--(\!)?>/.exec('<!-->')  ["-->", undefined, index: 2, input: "<!-->", groups: undefined]
  // exec正则方法，返回数组，第一个是匹配的字符串，后面返回子表达式的匹配内容

  
  // 匹配 -- >
  const match = /--(\!)?>/.exec(context.source)
  if (!match) {
    // 截去开头的 <!-- 
    content = context.source.slice(4)
    advanceBy(context, context.source.length)
    emitError(context, ErrorCodes.EOF_IN_COMMENT)
  } else {
    if (match.index <= 3) {
      // source太短，空注释
      emitError(context, ErrorCodes.ABRUPT_CLOSING_OF_EMPTY_COMMENT)
    }
    if (match[1]) {
      // 闭标签错误 (什么情况走到这里？)
      emitError(context, ErrorCodes.INCORRECTLY_CLOSED_COMMENT)
    }

    // 从<!--末尾开始，截到--之前。获得评论
    content = context.source.slice(4, match.index)
    // '<!-- xxx -->'  ==>  ' xxx '

    // 可能有的嵌套注释
    const s = context.source.slice(0, match.index)
    // '<!-- xxx '
    
    let prevIndex = 1,
      nestedIndex = 0

    // 只要s里面还包含<!--
    // 如果是 '<!-- 666 <!-- 123 -->'.indexOf('<!--', 1)
    while ((nestedIndex = s.indexOf('<!--', prevIndex)) !== -1) {
      // 从第二个<!--之前的截去
      advanceBy(context, nestedIndex - prevIndex + 1)
      if (nestedIndex + 4 < s.length) {
        emitError(context, ErrorCodes.NESTED_COMMENT)
      }
      // 重置开始index
      prevIndex = nestedIndex + 1
    }

    // 截取掉匹配到的 --> --!>
    advanceBy(context, match.index + match[0].length - prevIndex + 1)
  }

  // 至此。我们正常的node应该是截取掉了<!--  -->
  // content就是我们的文本内容
  return {
    type: NodeTypes.COMMENT,
    content,
    loc: getSelection(context, start)
  }
}
```


- parseCDATA
？？？


- parseElement(context, [])
source以 <\a <\B 开始的
```js

const TagType = {
  Start: 0,
  End: 1
}

function parseElement(context, ancestors) {
  // <a <B
  __DEV__ && assert(/^<[a-z]/i.test(context.source))

  // Start tag.
  const wasInPre = context.inPre
  const parent = last(ancestors)

  /** @param {step:001} */

  const element = parseTag(context, TagType.Start, parent)
  // 到这里一个NodeTypes.ELEMENT就被解析完了
  const isPreBoundary = context.inPre && !wasInPre

  // 是自闭的就返回，不是自闭的就继续
  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
    return element
  }

  // Children.
  ancestors.push(element)
  // 这是测试用例的祖先
  // { 
  //   type: 1,
  //   tag: 'div',
  //   tagType: Start,
  //   isSelfClosing: false,
  //   children: [],
  // }


  const mode = context.options.getTextMode(element.tag, element.ns)

  // 注意，出入了祖先。而且TextMode类型是根据tag和ns得到。
  // 我们这里是默认的TextModes.DATA

  // 至此 parent的开标签已经解析完毕
  // 开始 parseChildren


  /** @param {step:002} */
  /** @param {\n  <p v-bind:style="{ color: \'red\' }"/>\n  <!-- a comment with <html> inside it -->\n</div>} */

  const children = parseChildren(context, mode, ancestors)

  /** @param {step:003} */
  /** @param {</div>} */

  ancestors.pop()

  element.children = children

  // End tag.
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End, parent)
  } else {
    emitError(context, ErrorCodes.X_MISSING_END_TAG)
    if (context.source.length === 0 && element.tag.toLowerCase() === 'script') {
      const first = children[0]
      if (first && startsWith(first.loc.source, '<!--')) {
        emitError(context, ErrorCodes.EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT)
      }
    }
  }

  element.loc = getSelection(context, element.loc.start)

  if (isPreBoundary) {
    context.inPre = false
  }
  return element
}
```



- parseTag(context, TagType.Start, parent)
parseElement内部调用，parseTag(context, 0, undefined)
```js

const TagType = {
  Start: 0,
  End: 1
}
// type就是标签类型，开标签、闭标签
function parseTag(context, type, parent) {
  __DEV__ && assert(/^<\/?[a-z]/i.test(context.source))
  __DEV__ &&
    assert(
      type === (startsWith(context.source, '</') ? TagType.End : TagType.Start)
    )

  // Tag open.
  const start = getCursor(context)

  // 匹配标签
  // /^<\/?([a-z][^\t\r\n\f />]*)/i.exec('</div>')     ["</div", "div", index: 0, input: "</div>", groups: undefined]
  // /^<\/?([a-z][^\t\r\n\f />]*)/i.exec('<div>')      ["<div", "div", index: 0, input: "<div>", groups: undefined]
  // /^<\/?([a-z][^\t\r\n\f />]*)/i.exec('<di v>')     ["<di", "di", index: 0, input: "<di v>", groups: undefined]


  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  const tag = match[1]
  const ns = context.options.getNamespace(tag, parent)

  // 截去匹配到的<div
  advanceBy(context, match[0].length)
  // 截去开头的空白符
  advanceSpaces(context)

  // save current state in case we need to re-parse attributes with v-pre
  // 保存当前状态，以备需要使用v-pre重新解析属性时使用 (？？？？？)
  const cursor = getCursor(context)
  const currentSource = context.source

  // Attributes.
  let props = parseAttributes(context, type)
  // 执行完这个方法，我们就完成了一个tag的attribute的收集

  // 有一些pre是DIRECTIVE类型的节点
  // <div v-pre></div>
  // 就是上面这种，
  if (
    !context.inPre &&
    props.some(p => p.type === NodeTypes.DIRECTIVE && p.name === 'pre')
  ) {
    context.inPre = true
    // reset context
    extend(context, cursor) // 就是复制一下对象
    context.source = currentSource
    // re-parse attrs and filter out v-pre itself
    // 重新解析attrs并过滤掉v-pre本身
    props = parseAttributes(context, type).filter(p => p.name !== 'v-pre')
  }

  // 注意，这个地方的过滤是过滤编译，并不是忽略节点
  // 如果parse的template被带上了v-pre，则直接过滤编译，返回template，

  // 走到这一步，我们的context.source，已经把attribute截完了
  // `/>\n  <!-- a comment with <html> inside it -->\n</div></div>`
  
  // <div></div> <span/>
  // Tag close.
  let isSelfClosing = false

  if (context.source.length === 0) {
    // 闭标签都没有
    emitError(context, ErrorCodes.EOF_IN_TAG)
  } else {
    // 如果以/>开头，就是一个自闭的
    isSelfClosing = startsWith(context.source, '/>')
    if (type === TagType.End && isSelfClosing) {
      // 自闭的结束标签就是有问题的
      emitError(context, ErrorCodes.END_TAG_WITH_TRAILING_SOLIDUS)
    }
    // 自闭：   <span|/>|
    // 非自闭： <div|>|</div>
    advanceBy(context, isSelfClosing ? 2 : 1)
  }

  let tagType = ElementTypes.ELEMENT

  // 这里tagType的一些处理
  if (!context.inPre && !context.options.isCustomElement(tag)) {
    if (context.options.isNativeTag) {
      if (!context.options.isNativeTag(tag)) tagType = ElementTypes.COMPONENT
    } else {
      if (/^[A-Z]/.test(tag)) tagType = ElementTypes.COMPONENT
    }

    if (tag === 'slot') tagType = ElementTypes.SLOT
    else if (tag === 'template') tagType = ElementTypes.TEMPLATE
    else if (tag === 'portal' || tag === 'Portal') tagType = ElementTypes.PORTAL
    else if (tag === 'suspense' || tag === 'Suspense')
      tagType = ElementTypes.SUSPENSE
  }

  // 然后返回我们的element
  return {
    type: NodeTypes.ELEMENT,
    ns,
    tag,
    tagType,
    props,
    isSelfClosing,
    children: [],
    loc: getSelection(context, start),
    codegenNode: undefined // to be created during transform phase
  }
}

```





### pushNode(nodes, node)

```js
function pushNode(nodes, node) {

  if (node.type === NodeTypes.TEXT) {
    const prev = last(nodes)
    // Merge if both this and the previous node are text and those are
    // consecutive. This happens for cases like "a < b".
    // 如果是连续的Text就合并
    if (
      prev &&
      prev.type === NodeTypes.TEXT &&
      prev.loc.end.offset === node.loc.start.offset
    ) {
      prev.content += node.content
      prev.loc.end = node.loc.end
      prev.loc.source += node.loc.source
      return
    }
  }

  nodes.push(node)
}
```


### advanceSpaces(context)
过滤掉起始位置的换行、换页、空格、回车、制表符等看上去是空白的字符
```js
function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}
```


### parseAttributes(context, type)
context是上下文，type是tagType，开标签、闭标签
```js
function parseAttributes(context, type) {
  const props = []
  const attributeNames = new Set()
  // 只要还有string，而且还没到标签闭合
  while (
    context.source.length > 0 &&
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {

    // 如果遍历到了/
    if (startsWith(context.source, '/')) {
      emitError(context, ErrorCodes.UNEXPECTED_SOLIDUS_IN_TAG)
      advanceBy(context, 1)
      advanceSpaces(context)
      // 跳出本次
      continue
    }

    // 如果是闭标签，抛出END_TAG_WITH_ATTRIBUTES
    if (type === TagType.End) {
      emitError(context, ErrorCodes.END_TAG_WITH_ATTRIBUTES)
    }
    
    // 返回了一个 NodeTypes.ATTRIBUTE
    const attr = parseAttribute(context, attributeNames)
    if (type === TagType.Start) {
      // 如果是开始节点，把属性节点push进数组
      props.push(attr)
    }

    if (/^[^\t\r\n\f />]/.test(context.source)) {
      emitError(context, ErrorCodes.MISSING_WHITESPACE_BETWEEN_ATTRIBUTES)
    }
    advanceSpaces(context)
  }
  // 最终返回[NodeTypes.ATTRIBUTE]数组
  return props
}
```


### parseAttribute(context, attributeNames)
attributeNames是一个new Set()
```js
function parseAttribute(context, nameSet) {
  // 前面不会有空白字符
  __DEV__ && assert(/^[^\t\r\n\f />]/.test(context.source))

  // Name.
  const start = getCursor(context)
  
  // /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec('name=123&af! sdf=234') ["name", index: 0, input: "name=123&af! sdf=234", groups: undefined]
  // /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec('%tab=sdf=234') ["%tab", index: 0, input: "%tab=sdf=234", groups: undefined]
  // /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec('%ok23') ["%ok23 ", index: 0, input: "%ok23", groups: undefined]
  // /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec('=234csdf') ["%ok23 ", index: 0, input: "%ok23", groups: undefined]
  // /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec('=234csdf') ["=234csdf", index: 0, input: "=234csdf", groups: undefined]
  // /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec('=') ["=", index: 0, input: "=", groups: undefined]
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);

  // 取出attribute的名称
  const name = match[0]

  // 这里的判断需要仔细看一下，attributeNames由外层方法维护，在一次parse的时候，不允许有重复的value
  if (nameSet.has(name)) {
    emitError(context, ErrorCodes.DUPLICATE_ATTRIBUTE)
  }
  nameSet.add(name)

  // 如果只有一个=号
  if (name[0] === '=') {
    emitError(context, ErrorCodes.UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME)
  }
  {
    const pattern = /["'<]/g
    let m
    // 如果name里面包含"、'、<、抛出UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME
    while ((m = pattern.exec(name)) !== null) {
      emitError(
        context,
        ErrorCodes.UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME,
        m.index
      )
    }
  }

  // 把attribute的名称截取，至此获取到了name
  // name=123 -> =123
  advanceBy(context, name.length)

  // Value
  let value  = undefined

  // 如果空白字符开头，就去掉
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context) // 去除空格
    advanceBy(context, 1) // 截取等号
    advanceSpaces(context) // 去掉空格
    // 好value截取完成，value.content就是字符串
    value = parseAttributeValue(context)
    if (!value) {
      emitError(context, ErrorCodes.MISSING_ATTRIBUTE_VALUE)
    }
  }

  // pass
  const loc = getSelection(context, start)

  // attribute名称是
  // v-name
  // :name
  // @name=
  // #name (？？？？)

  if (!context.inPre && /^(v-|:|@|#)/.test(name)) {
    // 通过这里，我们可以看出，其实我们的v-bind，是可以携写成v----bind
    const match = /(?:^v-([a-z0-9-]+))?(?:(?::|^@|^#)([^\.]+))?(.+)?$/i.exec(name);

    // /(^v-([a-z0-9-]+))?((:|^@|^#)([^\.]+))?(.+)?$/i.exec(name);
  
    // 这是一个很复杂的正则，我们略过。直接看他得到了什么
    // match.exec('v-abcde')      ["v-abcde",     "abcde",  undefined,  undefined,  index: 0, input: "v-abcde",     groups: undefined]
    // match.exec('v-click:?+.')  ["v-click:?+.", "click",  "?+",       ".",        index: 0, input: "v-click:?+.", groups: undefined]
    
    // match.exec(':class')       [":class",    undefined,   "class",   undefined,  index: 0, input: ":class",      groups: undefined]
    // match.exec('@select')      ["@select",   undefined,  "select",   undefined,  index: 0, input: "@select",     groups: undefined]
    // match.exec('#unknow')      ["#unknow",   undefined,  "unknow",   undefined,  index: 0, input: "#unknow",     groups: undefined]
    
    // match.exec('@aq=fun')      ["@aq=fun",   undefined,  "aq=fun",   undefined,  index: 0, input: "@aq=fun",     groups: undefined]
    // match.exec('@[a]=fun')     ["@[a]=fun",  undefined,  "[a]=fun",  undefined,  index: 0, input: "@[a]=fun",    groups: undefined]
    let arg

    // 获取:、@、#之后；非\、.之前的字符串
    if (match[2]) {

      // '@aq=fun'.split('aq=fun', 2).shift()   @  
      // 'v-click:?+.'.split('?+', 2).shift()   v-click:    


      // 用match[2]去截context，再出队第一个元素，获取长度
      // 最后：我们获取到了前缀的长度

      // 这种正则看看它在干什么就行了
      const startOffset = name.split(match[2], 2).shift().length;

      // pass
      const loc = getSelection(
        context,
        getNewPosition(context, start, startOffset),
        getNewPosition(context, start, startOffset + match[2].length)
      )

      // 返回内容
      let content = match[2]
      let isStatic = true
      
      // 如果是方括号
      // 可以这样用，这里区分这种表达式是静态的还是动态的
      // @[testData]=testFun
      // :[testData]=testFun
      if (content.startsWith('[')) {
        isStatic = false

        if (!content.endsWith(']')) {
          emitError(
            context,
            ErrorCodes.X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END
          )
        }

        content = content.substr(1, content.length - 2)
      }
      // 直接返回表达式
      arg = {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        isStatic,
        isConstant: isStatic,
        loc
      }
    }

    // 如果attribute有value，而且有引号
    if (value && value.isQuoted) {
      const valueLoc = value.loc
      valueLoc.start.offset++
      valueLoc.start.column++
      valueLoc.end = advancePositionWithClone(valueLoc.start, value.content)
      // 截取两边的
      valueLoc.source = valueLoc.source.slice(1, -1)
    }

    // 这里说一下，这里只是对模板的解析，指令是否合理，不做判断
    // <p v-unknow="{ color: 'red' }"/>
    // 这样的也会解析通过
    // 返回指令节点

    // 所以如果我传入了一个// <p v-pre/>
    // 没有等号的，是直接走到这里，没有走if
    // attr.name = pre

    return {
      type: NodeTypes.DIRECTIVE,
      name:
        match[1] ||
        (startsWith(name, ':')
          ? 'bind'
          : startsWith(name, '@')
            ? 'on'
            : 'slot'),
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        // Treat as non-constant by default. This can be potentially set to
        // true by `transformExpression` to make it eligible for hoisting.
        isConstant: false,
        loc: value.loc
      },
      arg,
      modifiers: match[3] ? match[3].substr(1).split('.') : [],
      loc
    }
  }

  // 第二次提醒，这里没有对attribute命名的合法性做判断
  // <p ?sdfsd="{ color: 'red' }"/>\n`
  // 此类节点会被成功解析

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: value.loc
    },
    loc
  }
}
```


### parseAttributeValue(context)
name=123，此时传进的就是123
```js
function parseAttributeValue(context){
  const start = getCursor(context)
  let content
  // name=|123 class="aqara"  id='aqara' />
  // name=|"abc" class="aqara" id='aqara'  />
  const quote = context.source[0]

  const isQuoted = quote === `"` || quote === `'`

  // 如果是引号
  if (isQuoted) {
    // 截去引号
    advanceBy(context, 1)
    // 找出最近的相同类型的引号
    const endIndex = context.source.indexOf(quote)
    if (endIndex === -1) {
      // (有前引号没后引号？？？？？？？)
      content = parseTextData(
        context,
        context.source.length,
        TextModes.ATTRIBUTE_VALUE
      )
    } else {
      content = parseTextData(
        context, 
        endIndex, 
        TextModes.ATTRIBUTE_VALUE
      )
      advanceBy(context, 1)
    }
  } else {
    // Unquoted
    const match = /^[^\t\r\n\f >]+/.exec(context.source)
    if (!match) {
      return undefined
    }
    let unexpectedChars = /["'<=`]/g
    let m
    while ((m = unexpectedChars.exec(match[0])) !== null) {
      emitError(
        context,
        ErrorCodes.UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE,
        m.index
      )
    }
    content = parseTextData(context, match[0].length, TextModes.ATTRIBUTE_VALUE)
  }
  // 注意返回值
  return { content, isQuoted, loc: getSelection(context, start) }
}

```



### parseTextData(context, endIndex, TextModes.ATTRIBUTE_VALUE)
解析Text数据
```js

// abc" class="aqara" id='aqara'  />
// parseTextData(context, 3, TextModes.ATTRIBUTE_VALUE)

function parseTextData(context, length, mode) {
  if (mode === TextModes.RAWTEXT || mode === TextModes.CDATA) {
    // 这是上面提到的几种解析方式
    const text = context.source.slice(0, length)
    advanceBy(context, length)
    return text
  }

  // DATA or RCDATA. Entity decoding required.

  const end = context.offset + length
  // 这样这个end就是：endIndex的offset

  let text = ''

  // (offset是什么？？？？)
  // 相对于parse的template的第一个的偏移量，空白字符也会计算进去

  // 只要还没走到结尾
  while (context.offset < end) {


    // 这个正则，就是为了匹配转义序列
    const head = /&(?:#x?)?/i.exec(context.source)

    // /&(?:#x?)?/i.exec(context.source) 先去掉非捕获括号
    // /&(#x?)?/i.exec('&#x')
    // /&(?:#x?)?/i.exec('&#x4e2d;&#x56fd;')
    
    // 如果没匹配到了转义序列，或者匹配到的位置在之前
    if (!head || context.offset + head.index >= end) {
      // remaining = length
      // 直接全部截取，加入text中
      const remaining = end - context.offset
      text += context.source.slice(0, remaining)
      // 截去
      advanceBy(context, remaining)
      break
    }

    
    // 代码没看，可以看看他可能抛出的异常，来了解这个代码段的作用

    // MISSING_SEMICOLON_AFTER_CHARACTER_REFERENCE        缺少分号
    // UNKNOWN_NAMED_CHARACTER_REFERENCE                  引用了未知命名的字符
    // ABSENCE_OF_DIGITS_IN_NUMERIC_CHARACTER_REFERENCE   数字字符参考中缺少数字

    // 可以得知，后面是一些针对转义序列的一些处理，pass

    // Advance to the "&".
    // text += context.source.slice(0, head.index)
    // advanceBy(context, head.index)

    // if (head[0] === '&') {
    //   // Named character reference.
    //   let name = '',
    //     value = undefined
    //   if (/[0-9a-z]/i.test(context.source[1])) {
    //     for (
    //       let length = context.maxCRNameLength;
    //       !value && length > 0;
    //       --length
    //     ) {
    //       name = context.source.substr(1, length)
    //       value = context.options.namedCharacterReferences[name]
    //     }
    //     if (value) {
    //       const semi = name.endsWith(';')
    //       if (
    //         mode === TextModes.ATTRIBUTE_VALUE &&
    //         !semi &&
    //         /[=a-z0-9]/i.test(context.source[1 + name.length] || '')
    //       ) {
    //         text += '&'
    //         text += name
    //         advanceBy(context, 1 + name.length)
    //       } else {
    //         text += value
    //         advanceBy(context, 1 + name.length)
    //         if (!semi) {
    //           emitError(
    //             context,
    //             ErrorCodes.MISSING_SEMICOLON_AFTER_CHARACTER_REFERENCE
    //           )
    //         }
    //       }
    //     } else {
    //       emitError(context, ErrorCodes.UNKNOWN_NAMED_CHARACTER_REFERENCE)
    //       text += '&'
    //       text += name
    //       advanceBy(context, 1 + name.length)
    //     }
    //   } else {
    //     text += '&'
    //     advanceBy(context, 1)
    //   }
    // } else {
    //   // Numeric character reference.
    //   const hex = head[0] === '&#x'
    //   const pattern = hex ? /^&#x([0-9a-f]+);?/i : /^&#([0-9]+);?/
    //   const body = pattern.exec(context.source)
    //   if (!body) {
    //     text += head[0]
    //     emitError(
    //       context,
    //       ErrorCodes.ABSENCE_OF_DIGITS_IN_NUMERIC_CHARACTER_REFERENCE
    //     )
    //     advanceBy(context, head[0].length)
    //   } else {
    //     // https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-end-state
    //     let cp = Number.parseInt(body[1], hex ? 16 : 10)
    //     if (cp === 0) {
    //       emitError(context, ErrorCodes.NULL_CHARACTER_REFERENCE)
    //       cp = 0xfffd
    //     } else if (cp > 0x10ffff) {
    //       emitError(
    //         context,
    //         ErrorCodes.CHARACTER_REFERENCE_OUTSIDE_UNICODE_RANGE
    //       )
    //       cp = 0xfffd
    //     } else if (cp >= 0xd800 && cp <= 0xdfff) {
    //       emitError(context, ErrorCodes.SURROGATE_CHARACTER_REFERENCE)
    //       cp = 0xfffd
    //     } else if ((cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xfffe) === 0xfffe) {
    //       emitError(context, ErrorCodes.NONCHARACTER_CHARACTER_REFERENCE)
    //     } else if (
    //       (cp >= 0x01 && cp <= 0x08) ||
    //       cp === 0x0b ||
    //       (cp >= 0x0d && cp <= 0x1f) ||
    //       (cp >= 0x7f && cp <= 0x9f)
    //     ) {
    //       emitError(context, ErrorCodes.CONTROL_CHARACTER_REFERENCE)
    //       cp = CCR_REPLACEMENTS[cp] || cp
    //     }
    //     text += String.fromCodePoint(cp)
    //     advanceBy(context, body[0].length)
    //     if (!body[0].endsWith(';')) {
    //       emitError(
    //         context,
    //         ErrorCodes.MISSING_SEMICOLON_AFTER_CHARACTER_REFERENCE
    //       )
    //     }
    //   }
    // }
  }
  return text
}
```


### getSelection
这个方法的调用结果，最后都返回给了loc
```js
function getSelection(context, start, end) {
  end = end || getCursor(context)
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  }
}
```


### getNewPosition

```js
function getNewPosition(context, start, numberOfCharacters) {
  return advancePositionWithClone(
    start,
    context.originalSource.slice(start.offset, numberOfCharacters),
    numberOfCharacters
  )
}
```

### advancePositionWithClone
```js
function advancePositionWithClone(pos, source, numberOfCharacters = source.length) {
  return advancePositionWithMutation({ ...pos }, source, numberOfCharacters)
}
```

