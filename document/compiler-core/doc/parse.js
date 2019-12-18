
const { NodeTypes, Namespaces, ElementTypes } = require('../ast/ast.simple')
const { NO } = require('../share')
const { defaultOnError } = require('../error')
const { assert, advancePositionWithMutation, advancePositionWithClone } = require('../utils')
const TextModes = {
  DATA: 1, 
  RCDATA: 2, 
  RAWTEXT: 3, 
  CDATA: 4,
  ATTRIBUTE_VALUE: 5
}
const __DEV__ = true
const TagType = { Start: 0, End: 1 }


// 返回了一个root节点
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

const defaultParserOptions = {
  delimiters: [`{{`, `}}`],
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
  },
  // onError: defaultOnError
}



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
      options.namedCharacterReferences ||
        defaultParserOptions.namedCharacterReferences
    ).reduce((max, name) => Math.max(max, name.length), 0),
    inPre: false
  }
}



function getCursor(context) {
  const { column, line, offset } = context
  return { column, line, offset }
}


function last(xs) {
  return xs[xs.length - 1];
}

function startsWith(source, searchString) {
  return source.startsWith(searchString);
}

function isEnd(
  context,
  mode,
  ancestors
) {
  const s = context.source

  

  switch (mode) {
    case TextModes.DATA:
      if (startsWith(s, '</')) {

        //TODO: probably bad performance
        for (let i = ancestors.length - 1; i >= 0; --i) {
          if (startsWithEndTagOpen(s, ancestors[i].tag)) {
            return true
          }
        }
      }
      break

    case TextModes.RCDATA:
    case TextModes.RAWTEXT: {
      const parent = last(ancestors)
      if (parent && startsWithEndTagOpen(s, parent.tag)) {
        return true
      }
      break
    }

    case TextModes.CDATA:
      if (startsWith(s, ']]>')) {
        return true
      }
      break
  }

  return !s
}


function parseChildren( context, mode, ancestors ) {
  const parent = last(ancestors)
  const ns = parent ? parent.ns : Namespaces.HTML
  const nodes = []

  console.log(1111)
  while (!isEnd(context, mode, ancestors)) {

    

    __DEV__ && assert(context.source.length > 0)
    const s = context.source
    let node = undefined


    if (!context.inPre && startsWith(s, context.options.delimiters[0])) {
      // '{{'
      node = parseInterpolation(context, mode)
    } else if (mode === TextModes.DATA && s[0] === '<') {
      // https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
      if (s.length === 1) {
        emitError(context, ErrorCodes.EOF_BEFORE_TAG_NAME, 1)
      } else if (s[1] === '!') {
        // https://html.spec.whatwg.org/multipage/parsing.html#markup-declaration-open-state
        if (startsWith(s, '<!--')) {
          node = parseComment(context)
        } else if (startsWith(s, '<!DOCTYPE')) {
          // Ignore DOCTYPE by a limitation.
          node = parseBogusComment(context)
        } else if (startsWith(s, '<![CDATA[')) {
          if (ns !== Namespaces.HTML) {
            node = parseCDATA(context, ancestors)
          } else {
            emitError(context, ErrorCodes.CDATA_IN_HTML_CONTENT)
            node = parseBogusComment(context)
          }
        } else {
          emitError(context, ErrorCodes.INCORRECTLY_OPENED_COMMENT)
          node = parseBogusComment(context)
        }
      } else if (s[1] === '/') {
        // https://html.spec.whatwg.org/multipage/parsing.html#end-tag-open-state
        if (s.length === 2) {
          emitError(context, ErrorCodes.EOF_BEFORE_TAG_NAME, 2)
        } else if (s[2] === '>') {
          emitError(context, ErrorCodes.MISSING_END_TAG_NAME, 2)
          advanceBy(context, 3)
          continue
        } else if (/[a-z]/i.test(s[2])) {
          emitError(context, ErrorCodes.X_INVALID_END_TAG)
          parseTag(context, TagType.End, parent)
          continue
        } else {
          emitError(context, ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME, 2)
          node = parseBogusComment(context)
        }
      } else if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      } else if (s[1] === '?') {
        emitError(
          context,
          ErrorCodes.UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME,
          1
        )
        node = parseBogusComment(context)
      } else {
        emitError(context, ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME, 1)
      }
    }
    if (!node) {
      node = parseText(context, mode)
    }

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        pushNode(nodes, node[i])
      }
    } else {
      pushNode(nodes, node)
    }
  }

  // Whitespace management for more efficient output
  // 这里是对一些空白节点的过滤
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

function parseText(context, mode) {
  __DEV__ && assert(context.source.length > 0)

  const [open] = context.options.delimiters
  // TODO could probably use some perf optimization
  const endIndex = Math.min(
    ...[
      context.source.indexOf('<', 1),
      context.source.indexOf(open, 1),
      mode === TextModes.CDATA ? context.source.indexOf(']]>') : -1,
      context.source.length
    ].filter(n => n !== -1)
  )
  __DEV__ && assert(endIndex > 0)

  const start = getCursor(context)
  const content = parseTextData(context, endIndex, mode)

  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start)
  }
}


function parseTextData(
  context,
  length,
  mode
) {
  if (mode === TextModes.RAWTEXT || mode === TextModes.CDATA) {
    const text = context.source.slice(0, length)
    advanceBy(context, length)
    return text
  }

  // DATA or RCDATA. Entity decoding required.
  const end = context.offset + length
  let text = ''

  while (context.offset < end) {
    const head = /&(?:#x?)?/i.exec(context.source)
    if (!head || context.offset + head.index >= end) {
      const remaining = end - context.offset
      text += context.source.slice(0, remaining)
      advanceBy(context, remaining)
      break
    }

    // Advance to the "&".
    text += context.source.slice(0, head.index)
    advanceBy(context, head.index)

    if (head[0] === '&') {
      // Named character reference.
      let name = '',
        value = undefined
      if (/[0-9a-z]/i.test(context.source[1])) {
        for (
          let length = context.maxCRNameLength;
          !value && length > 0;
          --length
        ) {
          name = context.source.substr(1, length)
          value = context.options.namedCharacterReferences[name]
        }
        if (value) {
          const semi = name.endsWith(';')
          if (
            mode === TextModes.ATTRIBUTE_VALUE &&
            !semi &&
            /[=a-z0-9]/i.test(context.source[1 + name.length] || '')
          ) {
            text += '&'
            text += name
            advanceBy(context, 1 + name.length)
          } else {
            text += value
            advanceBy(context, 1 + name.length)
            if (!semi) {
              emitError(
                context,
                ErrorCodes.MISSING_SEMICOLON_AFTER_CHARACTER_REFERENCE
              )
            }
          }
        } else {
          emitError(context, ErrorCodes.UNKNOWN_NAMED_CHARACTER_REFERENCE)
          text += '&'
          text += name
          advanceBy(context, 1 + name.length)
        }
      } else {
        text += '&'
        advanceBy(context, 1)
      }
    } else {
      // Numeric character reference.
      const hex = head[0] === '&#x'
      const pattern = hex ? /^&#x([0-9a-f]+);?/i : /^&#([0-9]+);?/
      const body = pattern.exec(context.source)
      if (!body) {
        text += head[0]
        emitError(
          context,
          ErrorCodes.ABSENCE_OF_DIGITS_IN_NUMERIC_CHARACTER_REFERENCE
        )
        advanceBy(context, head[0].length)
      } else {
        // https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-end-state
        let cp = Number.parseInt(body[1], hex ? 16 : 10)
        if (cp === 0) {
          emitError(context, ErrorCodes.NULL_CHARACTER_REFERENCE)
          cp = 0xfffd
        } else if (cp > 0x10ffff) {
          emitError(
            context,
            ErrorCodes.CHARACTER_REFERENCE_OUTSIDE_UNICODE_RANGE
          )
          cp = 0xfffd
        } else if (cp >= 0xd800 && cp <= 0xdfff) {
          emitError(context, ErrorCodes.SURROGATE_CHARACTER_REFERENCE)
          cp = 0xfffd
        } else if ((cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xfffe) === 0xfffe) {
          emitError(context, ErrorCodes.NONCHARACTER_CHARACTER_REFERENCE)
        } else if (
          (cp >= 0x01 && cp <= 0x08) ||
          cp === 0x0b ||
          (cp >= 0x0d && cp <= 0x1f) ||
          (cp >= 0x7f && cp <= 0x9f)
        ) {
          emitError(context, ErrorCodes.CONTROL_CHARACTER_REFERENCE)
          cp = CCR_REPLACEMENTS[cp] || cp
        }
        text += String.fromCodePoint(cp)
        advanceBy(context, body[0].length)
        if (!body[0].endsWith(';')) {
          emitError(
            context,
            ErrorCodes.MISSING_SEMICOLON_AFTER_CHARACTER_REFERENCE
          )
        }
      }
    }
  }
  return text
}


function advanceBy(context, numberOfCharacters) {
  const { source } = context
  __DEV__ && assert(numberOfCharacters <= source.length)
  advancePositionWithMutation(context, source, numberOfCharacters)
  context.source = source.slice(numberOfCharacters)
}


function getSelection(
  context,
  start,
  end
) {
  end = end || getCursor(context)
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  }
}


function pushNode(nodes, node) {
  // ignore comments in production
  /* istanbul ignore next */
  if (!__DEV__ && node.type === NodeTypes.COMMENT) {
    return
  }

  if (node.type === NodeTypes.TEXT) {
    const prev = last(nodes)
    // Merge if both this and the previous node are text and those are
    // consecutive. This happens for cases like "a < b".
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


function parseElement(
  context,
  ancestors
) {
  __DEV__ && assert(/^<[a-z]/i.test(context.source))

  // Start tag.
  const wasInPre = context.inPre
  const parent = last(ancestors)
  const element = parseTag(context, TagType.Start, parent)

  const isPreBoundary = context.inPre && !wasInPre

  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
    return element
  }
  JSON.stringify()
  // Children.
  ancestors.push(element)

  console.log('>>> ', ancestors.length)

  const mode = context.options.getTextMode(element.tag, element.ns)
  const children = parseChildren(context, mode, ancestors)
 
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


function parseTag(
  context,
  type,
  parent
) {
  __DEV__ && assert(/^<\/?[a-z]/i.test(context.source))
  __DEV__ &&
    assert(
      type === (startsWith(context.source, '</') ? TagType.End : TagType.Start)
    )

  // Tag open.
  const start = getCursor(context)
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  const tag = match[1]
  const ns = context.options.getNamespace(tag, parent)

  advanceBy(context, match[0].length)
  advanceSpaces(context)

  // save current state in case we need to re-parse attributes with v-pre
  const cursor = getCursor(context)
  const currentSource = context.source

  // Attributes.
  let props = parseAttributes(context, type)

  // check v-pre
  if (
    !context.inPre &&
    props.some(p => p.type === NodeTypes.DIRECTIVE && p.name === 'pre')
  ) {
    context.inPre = true
    // reset context
    extend(context, cursor)
    context.source = currentSource
    // re-parse attrs and filter out v-pre itself
    props = parseAttributes(context, type).filter(p => p.name !== 'v-pre')
  }

  // Tag close.
  let isSelfClosing = false
  if (context.source.length === 0) {
    emitError(context, ErrorCodes.EOF_IN_TAG)
  } else {
    isSelfClosing = startsWith(context.source, '/>')
    if (type === TagType.End && isSelfClosing) {
      emitError(context, ErrorCodes.END_TAG_WITH_TRAILING_SOLIDUS)
    }
    advanceBy(context, isSelfClosing ? 2 : 1)
  }

  let tagType = ElementTypes.ELEMENT
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


function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}


function parseAttributes(
  context,
  type
) {
  const props = []
  const attributeNames = new Set()
  while (
    context.source.length > 0 &&
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {
    if (startsWith(context.source, '/')) {
      emitError(context, ErrorCodes.UNEXPECTED_SOLIDUS_IN_TAG)
      advanceBy(context, 1)
      advanceSpaces(context)
      continue
    }
    if (type === TagType.End) {
      emitError(context, ErrorCodes.END_TAG_WITH_ATTRIBUTES)
    }

    const attr = parseAttribute(context, attributeNames)
    if (type === TagType.Start) {
      props.push(attr)
    }

    if (/^[^\t\r\n\f />]/.test(context.source)) {
      emitError(context, ErrorCodes.MISSING_WHITESPACE_BETWEEN_ATTRIBUTES)
    }
    advanceSpaces(context)
  }
  return props
}



function parseAttribute(
  context,
  nameSet
) {
  __DEV__ && assert(/^[^\t\r\n\f />]/.test(context.source))

  // Name.
  const start = getCursor(context)
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0]

  if (nameSet.has(name)) {
    emitError(context, ErrorCodes.DUPLICATE_ATTRIBUTE)
  }
  nameSet.add(name)

  if (name[0] === '=') {
    emitError(context, ErrorCodes.UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME)
  }
  {
    const pattern = /["'<]/g
    let m
    while ((m = pattern.exec(name)) !== null) {
      emitError(
        context,
        ErrorCodes.UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME,
        m.index
      )
    }
  }

  advanceBy(context, name.length)

  // Value
  let value  = undefined

  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context)
    advanceBy(context, 1)
    advanceSpaces(context)
    value = parseAttributeValue(context)
    if (!value) {
      emitError(context, ErrorCodes.MISSING_ATTRIBUTE_VALUE)
    }
  }
  const loc = getSelection(context, start)

  if (!context.inPre && /^(v-|:|@|#)/.test(name)) {
    const match = /(?:^v-([a-z0-9-]+))?(?:(?::|^@|^#)([^\.]+))?(.+)?$/i.exec(name);

    let arg

    if (match[2]) {
      const startOffset = name.split(match[2], 2).shift().length;
      const loc = getSelection(
        context,
        getNewPosition(context, start, startOffset),
        getNewPosition(context, start, startOffset + match[2].length)
      )
      let content = match[2]
      let isStatic = true

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

      arg = {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        isStatic,
        isConstant: isStatic,
        loc
      }
    }

    if (value && value.isQuoted) {
      const valueLoc = value.loc
      valueLoc.start.offset++
      valueLoc.start.column++
      valueLoc.end = advancePositionWithClone(valueLoc.start, value.content)
      valueLoc.source = valueLoc.source.slice(1, -1)
    }

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



function parseAttributeValue(
  context
){
  const start = getCursor(context)
  let content

  const quote = context.source[0]
  const isQuoted = quote === `"` || quote === `'`
  if (isQuoted) {
    // Quoted value.
    advanceBy(context, 1)

    const endIndex = context.source.indexOf(quote)
    if (endIndex === -1) {
      content = parseTextData(
        context,
        context.source.length,
        TextModes.ATTRIBUTE_VALUE
      )
    } else {
      content = parseTextData(context, endIndex, TextModes.ATTRIBUTE_VALUE)
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

  return { content, isQuoted, loc: getSelection(context, start) }
}


function getNewPosition(
  context,
  start,
  numberOfCharacters
) {
  return advancePositionWithClone(
    start,
    context.originalSource.slice(start.offset, numberOfCharacters),
    numberOfCharacters
  )
}


function startsWithEndTagOpen(source, tag) {
  return (
    startsWith(source, '</') &&
    source.substr(2, tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\n\f />]/.test(source[2 + tag.length] || '>')
  )
}


function parseComment(context) {
  __DEV__ && assert(startsWith(context.source, '<!--'))

  const start = getCursor(context)
  let content

  // Regular comment.
  const match = /--(\!)?>/.exec(context.source)
  if (!match) {
    content = context.source.slice(4)
    advanceBy(context, context.source.length)
    emitError(context, ErrorCodes.EOF_IN_COMMENT)
  } else {
    if (match.index <= 3) {
      emitError(context, ErrorCodes.ABRUPT_CLOSING_OF_EMPTY_COMMENT)
    }
    if (match[1]) {
      emitError(context, ErrorCodes.INCORRECTLY_CLOSED_COMMENT)
    }
    content = context.source.slice(4, match.index)

    // Advancing with reporting nested comments.
    const s = context.source.slice(0, match.index)
    let prevIndex = 1,
      nestedIndex = 0
    while ((nestedIndex = s.indexOf('<!--', prevIndex)) !== -1) {
      advanceBy(context, nestedIndex - prevIndex + 1)
      if (nestedIndex + 4 < s.length) {
        emitError(context, ErrorCodes.NESTED_COMMENT)
      }
      prevIndex = nestedIndex + 1
    }
    advanceBy(context, match.index + match[0].length - prevIndex + 1)
  }

  return {
    type: NodeTypes.COMMENT,
    content,
    loc: getSelection(context, start)
  }
}
/**
 * 
 * 
 * 
 */
const ast = parse(
  `<div :class="{ some: condition }">\n` +
    `  <p v-bind:style="{ color: 'red' }"/>\n` +
    `  <!-- a comment with <html> inside it -->\n` +
    `</div>`
)

const ast = parse(
  `<div>
    <span>1</span>
    <div>
      <h1>2.1</h1>
      <h2>2.2</h2>
      <h3>2.3</h3>
      <h4>2.3</h4>
    </div>
  </div>`
)

// 这是调用的结果，很长，让人不想看。我们简化一下
exports.TEMPLATE_AST = {
  "type":0,
  "children":[
      {
          "type":1,
          "ns":0,
          "tag":"div",
          "tagType":0,
          "props":[
              {
                  "type":7,
                  "name":"bind",
                  "exp":{
                      "type":4,
                      "content":"{ some: condition }",
                      "isStatic":false,
                      "isConstant":false,
                      "loc":{
                          "start":{
                              "column":14,
                              "line":1,
                              "offset":13
                          },
                          "end":{
                              "column":33,
                              "line":1,
                              "offset":32
                          },
                          "source":"{ some: condition }"
                      }
                  },
                  "arg":{
                      "type":4,
                      "content":"class",
                      "isStatic":true,
                      "isConstant":true,
                      "loc":{
                          "start":{
                              "column":7,
                              "line":1,
                              "offset":6
                          },
                          "end":{
                              "column":12,
                              "line":1,
                              "offset":11
                          },
                          "source":"class"
                      }
                  },
                  "modifiers":[

                  ],
                  "loc":{
                      "start":{
                          "column":6,
                          "line":1,
                          "offset":5
                      },
                      "end":{
                          "column":34,
                          "line":1,
                          "offset":33
                      },
                      "source":`:class="{ some: condition }"`
                  }
              }
          ],
          "isSelfClosing":false,
          "children":[
              {
                  "type":1,
                  "ns":0,
                  "tag":"p",
                  "tagType":0,
                  "props":[
                      {
                          "type":7,
                          "name":"bind",
                          "exp":{
                              "type":4,
                              "content":"{ color: 'red' }",
                              "isStatic":false,
                              "isConstant":false,
                              "loc":{
                                  "start":{
                                      "column":20,
                                      "line":2,
                                      "offset":54
                                  },
                                  "end":{
                                      "column":36,
                                      "line":2,
                                      "offset":70
                                  },
                                  "source":"{ color: 'red' }"
                              }
                          },
                          "arg":{
                              "type":4,
                              "content":"style",
                              "isStatic":true,
                              "isConstant":true,
                              "loc":{
                                  "start":{
                                      "column":13,
                                      "line":2,
                                      "offset":47
                                  },
                                  "end":{
                                      "column":18,
                                      "line":2,
                                      "offset":52
                                  },
                                  "source":"style"
                              }
                          },
                          "modifiers":[

                          ],
                          "loc":{
                              "start":{
                                  "column":6,
                                  "line":2,
                                  "offset":40
                              },
                              "end":{
                                  "column":37,
                                  "line":2,
                                  "offset":71
                              },
                              "source":`v-bind:style="{ color: 'red' }"`
                          }
                      }
                  ],
                  "isSelfClosing":true,
                  "children":[

                  ],
                  "loc":{
                      "start":{
                          "column":3,
                          "line":2,
                          "offset":37
                      },
                      "end":{
                          "column":39,
                          "line":2,
                          "offset":73
                      },
                      "source":`<p v-bind:style="{ color: 'red' }"/>`
                  }
              },
              {
                  "type":3,
                  "content":" a comment with <html> inside it ",
                  "loc":{
                      "start":{
                          "column":3,
                          "line":3,
                          "offset":76
                      },
                      "end":{
                          "column":43,
                          "line":3,
                          "offset":116
                      },
                      "source":"<!-- a comment with <html> inside it -->"
                  }
              }
          ],
          "loc":{
              "start":{
                  "column":1,
                  "line":1,
                  "offset":0
              },
              "end":{
                  "column":7,
                  "line":4,
                  "offset":123
              },
              "source":`<div :class="{ some: condition }">
              <p v-bind:style="{ color: 'red' }"/>
              <!-- a comment with <html> inside it -->
              </div>`
          }
      }
  ],
  "helpers":[

  ],
  "components":[

  ],
  "directives":[

  ],
  "hoists":[

  ],
  "cached":0,
  "loc":{
      "start":{
          "column":1,
          "line":1,
          "offset":0
      },
      "end":{
          "column":7,
          "line":4,
          "offset":123
      },
      "source":`<div :class="{ some: condition }">
      <p v-bind:style="{ color: 'red' }"/>
      <!-- a comment with <html> inside it -->
      </div>`
  }
}


// 我们简化一下结果