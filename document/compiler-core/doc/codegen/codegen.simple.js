
// 这是我们上一步parse得到的ast语法树
const { TEMPLATE_AST } = require('../parse/parse.simple')

const __BROWSER__ = false

// 1
function generate(ast, options) {
  const context = createCodegenContext(ast, options)
  const {
    mode,
    push,
    helper, 
    prefixIdentifiers,
    indent,
    deindent,
    newline
  } = context
  const hasHelpers = ast.helpers.length > 0
  const useWithBlock = !prefixIdentifiers && mode !== 'module'

  // preambles
  if (mode === 'function') {

    // 为helpers创建const声明
    // 在前缀模式中：我们将const放在顶部，这样能一次完成
    // 不在前缀模式中：我们就将cosnt放在with结构中，来避免'in'检查来造成的损耗？？
    
    if (hasHelpers) {
      if (prefixIdentifiers) {
        
        // function helper(key) {
        //   const name = helperNameMap[key]
        //   return prefixIdentifiers ? name : `_${name}`
        // }
        // [Symbol('createVNode'), Symbol('resolveDirective')].map(helper).join(', ')
        // helperNameMap是Symobol的一种使用场景
        
        // 添加代码
        push(`const { ${ast.helpers.map(helper).join(', ')} } = Vue\n`)
      } else {
        // "with" mode.
        // 避免冲突
        push(`const _Vue = Vue\n`)
        // in "with" mode, helpers are declared inside the with block to avoid
        // has check cost, but hoists are lifted out of the function - we need
        // to provide the helper here.
        // 在with模式时，为了避免has检查，helpers定义在with结构中。但是

        
        if (ast.hoists.length) {
          push(
            `const _${helperNameMap[CREATE_VNODE]} = Vue.${
              helperNameMap[CREATE_VNODE]
            }\n`
          )
          if (ast.helpers.includes(CREATE_COMMENT)) {
            push(
              `const _${helperNameMap[CREATE_COMMENT]} = Vue.${
                helperNameMap[CREATE_COMMENT]
              }\n`
            )
          }
        }
      }
    }
    genHoists(ast.hoists, context)
    newline()
    push(`return `)
  } else {
    // generate import statements for helpers
    if (hasHelpers) {
      push(`import { ${ast.helpers.map(helper).join(', ')} } from "vue"\n`)
    }
    genHoists(ast.hoists, context)
    newline()
    push(`export default `)
  }

  // enter render function
  push(`function render() {`)
  indent()

  if (useWithBlock) {
    push(`with (this) {`)
    indent()
    // function mode const declarations should be inside with block
    // also they should be renamed to avoid collision with user properties
    if (hasHelpers) {
      push(
        `const { ${ast.helpers
          .map(s => `${helperNameMap[s]}: _${helperNameMap[s]}`)
          .join(', ')} } = _Vue`
      )
      newline()
      if (ast.cached > 0) {
        push(`const _cache = $cache`)
        newline()
      }
      newline()
    }
  } else {
    push(`const _ctx = this`)
    if (ast.cached > 0) {
      newline()
      push(`const _cache = _ctx.$cache`)
    }
    newline()
  }

  // generate asset resolution statements
  if (ast.components.length) {
    genAssets(ast.components, 'component', context)
  }
  if (ast.directives.length) {
    genAssets(ast.directives, 'directive', context)
  }
  if (ast.components.length || ast.directives.length) {
    newline()
  }

  // generate the VNode tree expression
  push(`return `)
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  } else {
    push(`null`)
  }

  if (useWithBlock) {
    deindent()
    push(`}`)
  }

  deindent()
  push(`}`)
  return {
    ast,
    code: context.code,
    map: undefined //context.map ? context.map.toJSON() : undefined
  }
}

// 2
function createCodegenContext(ast, {
  mode = 'function',
  prefixIdentifiers = mode === 'module',
  sourceMap = false,
  filename = `template.vue.html`
}) {

  const context = {
    mode,
    prefixIdentifiers,
    sourceMap,
    filename,
    source: ast.loc.source,
    code: ``,
    column: 1,
    line: 1,
    offset: 0,
    indentLevel: 0,

    // lazy require source-map implementation, only in non-browser builds!
    map:
    __BROWSER__ || !sourceMap
        ? undefined
        : new (loadDep('source-map')).SourceMapGenerator(),

    helper(key) {
      const name = helperNameMap[key]
      return prefixIdentifiers ? name : `_${name}`
    },
    push(code, node, openOnly) {
      context.code += code
      if (!__BROWSER__ && context.map) {
        if (node) {
          let name
          if (node.type === NodeTypes.SIMPLE_EXPRESSION && !node.isStatic) {
            const content = node.content.replace(/^_ctx\./, '')
            if (content !== node.content && isSimpleIdentifier(content)) {
              name = content
            }
          }
          addMapping(node.loc.start, name)
        }
        advancePositionWithMutation(context, code)
        if (node && !openOnly) {
          addMapping(node.loc.end)
        }
      }
    },
    resetMapping(loc) {
      if (!__BROWSER__ && context.map) {
        addMapping(loc.start)
      }
    },
    indent() {
      newline(++context.indentLevel)
    },
    deindent(withoutNewLine = false) {
      if (withoutNewLine) {
        --context.indentLevel
      } else {
        newline(--context.indentLevel)
      }
    },
    newline() {
      newline(context.indentLevel)
    }
  }

  function newline(n) {
    context.push('\n' + `  `.repeat(n))
  }

  function addMapping(loc, name) {
    context.map.addMapping({
        name: name,
        source: context.filename,
        original: {
            line: loc.line,
            column: loc.column - 1
        },
        generated: {
            line: context.line,
            column: context.column - 1
        }
    });
  }

  if (!__BROWSER__ && context.map) {
    context.map.setSourceContent(filename, context.source)
  }
  return context
}

// 3
function genHoists(hoists, context) {
  if (!hoists.length) {
      return;
  }
  context.newline();
  hoists.forEach(function (exp, i) {
      context.push("const _hoisted_" + (i + 1) + " = ");
      genNode(exp, context);
      context.newline();
  });
}


const code = generate(TEMPLATE_AST, { mode: 'function' })
console.log(123, code)

const moduleCode = { 
  ast: { 
    type: 0,
    children: [ [Object] ],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
    loc: { 
      start: [Object],
      end: [Object],
      source: `
        <div :class="{ some: condition }">  
          <p v-bind:style="{ color: "red" }"/>  
          <!-- a comment with <html> insideit -->
        </div>
      ` 
    } 
  },
  code:`
    export default function render() {
      const _ctx = this
      return null
    }
  `,
  map: undefined 
}

const functionCode =  { 
  ast: { 
    type: 0,
    children: [ [Object] ],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
    loc: { 
      start: [Object],
      end: [Object],
      source: `
        <div :class="{ some: condition }">  
          <p v-bind:style="{ color: "red" }"/>  
          <!-- a comment with <html> insideit -->
        </div>
      ` 
    } 
  },
  code: `
    return function render() {
      with (this) {
        return null
      }
    }`,
  map: undefined 
}

// 感觉这方法没啥作用（看看为什么没有作用）