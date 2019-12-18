
interface ParserOptions {
  isVoidTag?: (tag: string) => boolean // e.g. img, br, hr
  isNativeTag?: (tag: string) => boolean // e.g. loading-indicator in weex
  isPreTag?: (tag: string) => boolean // e.g. <pre> where whitespace is intact
  isCustomElement?: (tag: string) => boolean
  getNamespace?: (tag: string, parent: ElementNode | undefined) => Namespace
  getTextMode?: (tag: string, ns: Namespace) => TextModes
  delimiters?: [string, string] // ['{{', '}}']
  namedCharacterReferences?: { [name: string]: string | undefined }
  onError?: (error: CompilerError) => void
}

/**
 * 入参：template、options
 * 出参：Node
 */
function parse(content: string, options: ParserOptions = {}): RootNode {
  return {
    type: NodeTypes.ROOT,
    children: parseChildren(context, TextModes.DATA, []),
    loc: getSelection(context, start)
  }
}

// 解析结果的children字段
function parseChildren(
  context: ParserContext,
  mode: TextModes,
  ancestors: ElementNode[]
): TemplateChildNode[] {}


// 解析结果的loc字段
function getSelection(
  context: ParserContext,
  start: Position,
  end?: Position
): SourceLocation {
  end = end || getCursor(context)
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  }
}




const NODES = [ 
  null,
  { 
    type: 1,
    ns: 0,
    tag: 'p',
    tagType: 0,
    props: [ [Object] ],
    isSelfClosing: true,
    children: [],
    loc:{ 
       source: '<p v-bind:style="{ color: \'red\' }"/>' 
    },
  },
  null,
  { 
    type: 3,
    content: ' a comment with <html> inside it ',
    loc:{ 
       source: '<!-- a comment with <html> inside it -->' 
    } 
  },
  null
]