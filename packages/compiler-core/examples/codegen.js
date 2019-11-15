const { generate } = require('../js/compiler-core/src/codegen')
const { CREATE_VNODE, RESOLVE_DIRECTIVE } = require("../js/compiler-core/src/runtimeHelpers");


const isString = (val) => typeof val === 'string';

/**
 * @function
 * 返回一个root节点
 */
function createRoot(options) {
  return {
    type: 0,
    children: [],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
    codegenNode: createSimpleExpression(`null`, false),
    loc: 'USELESS2',
    ...options
  }
}
const locStub = {
  source: '',
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 }
};


function createArrayExpression(elements, loc = locStub) {
  return {
      type: 16 /* JS_ARRAY_EXPRESSION */,
      loc,
      elements
  };
}
function createObjectExpression(properties, loc = locStub) {
  return {
      type: 14 /* JS_OBJECT_EXPRESSION */,
      loc,
      properties
  };
}
function createObjectProperty(key, value) {
  return {
      type: 15 /* JS_PROPERTY */,
      loc: locStub,
      key: isString(key) ? createSimpleExpression(key, true) : key,
      value
  };
}
function createSimpleExpression(content, isStatic, loc = locStub, isConstant = false) {
  return {
      type: 4 /* SIMPLE_EXPRESSION */,
      loc,
      isConstant,
      content,
      isStatic
  };
}
function createInterpolation(content, loc) {
  return {
      type: 5 /* INTERPOLATION */,
      loc,
      content: isString(content)
          ? createSimpleExpression(content, false, loc)
          : content
  };
}
function createCompoundExpression(children, loc = locStub) {
  return {
      type: 8 /* COMPOUND_EXPRESSION */,
      loc,
      children
  };
}
function createCallExpression(callee, args = [], loc = locStub) {
  return {
      type: 13 /* JS_CALL_EXPRESSION */,
      loc,
      callee,
      arguments: args
  };
}
function createFunctionExpression(params, returns, newline = false, loc = locStub) {
  return {
      type: 17 /* JS_FUNCTION_EXPRESSION */,
      params,
      returns,
      newline,
      loc
  };
}
function createSequenceExpression(expressions) {
  return {
      type: 18 /* JS_SEQUENCE_EXPRESSION */,
      expressions,
      loc: locStub
  };
}
function createConditionalExpression(test, consequent, alternate) {
  return {
      type: 19 /* JS_CONDITIONAL_EXPRESSION */,
      test,
      consequent,
      alternate,
      loc: locStub
  };
}
function createCacheExpression(index, value, isVNode = false) {
  return {
      type: 20 /* JS_CACHE_EXPRESSION */,
      index,
      value,
      isVNode,
      loc: locStub
  };
}
function createElementWithCodegen(args) {
  return {
    type: 1,
    loc: locStub,
    ns: 0,
    tag: 'div',
    tagType: 0,
    isSelfClosing: false,
    props: [],
    children: [],
    codegenNode: {
      type: 13,
      loc: locStub,
      callee: CREATE_VNODE,
      arguments: args
    }
  }
}

/**
 * @function createRoot 
 * 通过上面可以发现，这个方法就是返回一个根节点。把参数合并进去
 */
const root = createRoot({
  helpers: [CREATE_VNODE, RESOLVE_DIRECTIVE]
})
const rootResult = { 
  type: 0,
  children: [],
  helpers: [ CREATE_VNODE, RESOLVE_DIRECTIVE ],
  components: [],
  directives: [],
  hoists: [],
  cached: 0,
  codegenNode: { 
    type: 4,
    loc: [null],
    isConstant: false,
    content: 'null',
    isStatic: false 
  },
  loc: 'USELESS2' 
}



/**
 * @param { Number 001 }
 * @function generate 
 * 方法入参：根节点root、module模式
 * 方法出参：ast、code
 * 方法总结：
 *    1、generate能够import helpers里面对应的模块
 */
const untest001 = generate(root, { mode: 'module' })
const output001 = { 
  ast: { 
    type: 0,
    children: [],
    helpers: [ CREATE_VNODE, RESOLVE_DIRECTIVE ],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
    codegenNode: { 
      type: 4,
      loc: [null],
      isConstant: false,
      content: 'null',
      isStatic: false 
    },
    loc: 'USELESS2' 
  },
  code: `
    import { createVNode, resolveDirective } from "vue"
    export default function render() {
      const _ctx = this
      return null
    }
  `,
  map: undefined 
}


/**
 * @symbol 
 * 关注点：我们可以看看Vue里面是如何使用symbol的
 */
function anonymous(){
  const result = `import { ${helperNameMap[CREATE_VNODE]}, ${
    helperNameMap[RESOLVE_DIRECTIVE]
  } } from "vue"`
  const CREATE_VNODE = Symbol('createVNode')
  const RESOLVE_DIRECTIVE = Symbol('resolveDirective')
  const helperNameMap = {
    [CREATE_VNODE]: 'createVNode',
    [RESOLVE_DIRECTIVE]: 'resolveDirective',
  }
  // import { createVNode, resolveDirective } from "vue"
}


/**
 * @param { Number 002 }
 * @function generate 
 * 方法入参：根节点root、function模式
 * 方法出参：ast、code
 * 方法总结：
 *    1、generate能够import helpers里面对应的模块
 *    2、并且会加上下划线的预处理
 */
const untest002 = generate(root, { mode: 'function' })
const output002 = { 
  ast: { 
    root
  },
  code: `
    const _Vue = Vue
    return function render() {
      with (this) {
        const { createVNode: _createVNode , resolveDirective: _resolveDirective } = _Vue
        return null
      }
    }`,
  map: undefined 
}


/**
 * @param { Number 003 }
 * @function generate
 * 方法入参：根节点root、function模式、前缀标志符true
 * 方法出参：ast、code
 * 方法总结：
 *    1、不包含const _Vue
 *    2、包含对helpers里面的解构赋值
 */
const untest003 = generate(root, { mode: 'function', prefixIdentifiers: true })
const output003 = { 
  ast: { 
    root
  },
  code: `
    const { createVNode, resolveDirective } = Vue
    return function render() {
      const _ctx = this
      return null
    }
  `,
  map: undefined 
}


/**
 * @param { Number 004 }
 * @function generate
 * 方法入参：根节点root2、function模式
 * 方法出参：ast、code
 * 方法总结：
 *    1、能够根据根节点root2里面的components、directives，在代码中正确的const引出
 */
const root2 = createRoot({
  components: [`Foo`, `bar-baz`, `barbaz`],
  directives: [`my_dir`]
})
const untest004 = generate(root2, { mode: 'function' })
const output004 = { 
  ast: { 
    components: [ 'Foo', 'bar-baz', 'barbaz' ],
    directives: [ 'my_dir' ],
    ...root2
  },
  code: `
    return function render() {
      with (this) {
        const _component_Foo = _resolveComponent("Foo")
        const _component_bar_baz = _resolveComponent("bar-baz")
        const _component_barbaz = _resolveComponent("barbaz")
        const _directive_my_dir = _resolveDirective("my_dir")
        return null
      }
    }
  `,
  map: undefined 
}



/**
 * @param { Number 005 }
 * @function generate
 * 方法入参：hoists：字符串
 * 方法出参：ast、code
 * 方法总结：
 *    1、createSimpleExpression 创建一个声明字符串的表达式
 *    2、createObjectExpression 创建一个对象
 *    3、createObjectProperty   创建一个对象的属性
 */
const root3 = createRoot({
  hoists: [
    createSimpleExpression(`hello`, false, locStub),
    createObjectExpression(
      [
        createObjectProperty(
          createSimpleExpression(`id`, true, locStub),
          createSimpleExpression(`foo`, true, locStub)
        )
      ],
      locStub
    )
  ]
})
const untest005 = generate(root3)
const output005 = { 
  ast: { 
    root
  },
  code:`
    const _hoisted_1 = hello
    const _hoisted_2 = { id: "foo" }
    return function render() {
      with (this) {
        return null
      }
    }
  `,
  map: undefined 
}


/**
 * @param { Number 006 }
 * @function generate prefixIdentifiers
 * 方法入参：空root，前缀表达式false
 * 方法出参：ast、code
 * 方法总结：
 *    1、包含const _ctx = this  
 */
const untest006 = generate(createRoot(), { prefixIdentifiers: true })
const output006 = { 
  ast: { 
    root
  },
  code:`
    return function render() {  
      const _ctx = this  
      return null
    }
  `,
  map: undefined 
}

/**
 * @param { Number 007 }
 * @function generate 
 * 方法入参：codegenNode
 * 方法出参：ast、code
 * 方法总结：
 *    1、针对NodeTypes.TEXT类型，能够返回codegenNode里面的content字段
 */
const untest007 = generate(
  createRoot({
    codegenNode: {
      type: 2,
      content: 'hello',
      loc: locStub
    }
  })
)
var output007 = { 
  ast: { 
    root
  },
  code:`
    return function render() {
      with (this) {
        return "hello"  
      }
    }
  `,
  map: undefined 
}



/**
 * @param { Number 008 }
 * @function generate interpolation
 * 方法入参：codegenNode 创建插值
 * 方法出参：ast、code
 * 方法总结：
 *    1、针对createInterpolation，能够返回参数的toString
 */
const untest008 = generate(
  createRoot({
    codegenNode: createInterpolation(`hello`, locStub)
  })
)
const output008 = {
  ast: {

  },
  code:`
    return function render() {
      with (this) {
        return _toString(hello)  
      }
    }
  `
}


/**
 * @param { Number 009 }
 * @function generate 
 * 方法入参：codegenNode 创建插值
 * 方法出参：ast、code
 * 方法总结：
 *    1、针对NodeTypes.COMMENT，能够返回参数的_createCommentVNode
 */
const untest009 = generate(
  createRoot({
    codegenNode: {
      type: 3,
      content: 'foo',
      loc: {}
    }
  })
)
const output009 = { 
  ast: {

  },
  code: `
    return function render() {
      with (this) {
        return _createCommentVNode("foo")
      }
    }
  `,
  map: undefined 
}


/**
 * @param { Number 010 }
 * @function generate 
 * 方法入参：codegenNode 创建复合表达式
 * 方法出参：ast、code
 * 方法总结：
 *    1、针对createCompoundExpression，能够返回正确的前缀 + toString
 */
const untest010 = generate(
  createRoot({
    codegenNode: createCompoundExpression([
      `_ctx.`,
      createSimpleExpression(`foo`, false, locStub),
      ` + `,
      {
        type: 5,
        loc: locStub,
        content: createSimpleExpression(`bar`, false, locStub)
      }
    ])
  })
)
const output010 = { 
  ast: {

  },
  code: `
    return function render() {
      with (this) {
        return _ctx.foo + _toString(bar)
      }
    }
  `,
  map: undefined 
}


/**
 * @param { Number 011 }
 * @function generate 
 * 方法入参：codegenNode 创建序列表达式
 * 方法出参：ast、code
 * 方法总结：
 *    1、NodeTypes.IF
 */
const untest011 = generate(
  createRoot({
    codegenNode: {
      type: 9,
      loc: locStub,
      branches: [],
      codegenNode: createSequenceExpression([
        createSimpleExpression('foo', false),
        createSimpleExpression('bar', false)
      ])
    }
  })
)
const output011 = { 
  ast: {

  },
  code:
    `return function render() {
        with (this) {
          return (foo, bar)
        }
      }
    `,
  map: undefined 
}


/**
 * @param { Number 012 }
 * @function generate 
 * 方法入参：codegenNode 创建序列表达式
 * 方法出参：ast、code
 * 方法总结：
 *    1、针对NodeTypes.IF
 */
const expression012 = generate(
  createRoot({
    codegenNode: {
      type: 11,
      loc: locStub,
      source: createSimpleExpression('foo', false),
      valueAlias: undefined,
      keyAlias: undefined,
      objectIndexAlias: undefined,
      children: [],
      codegenNode: createSequenceExpression([
        createSimpleExpression('foo', false),
        createSimpleExpression('bar', false)
      ])
    }
  })
)
const result012 = { ast:
  { type: 0,
    children: [],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
    codegenNode:
     { type: 11,
       loc: [Object],
       source: [Object],
       valueAlias: undefined,
       keyAlias: undefined,
       objectIndexAlias: undefined,
       children: [],
       codegenNode: [Object] },
    loc: 'USELESS2' },
 code:
  `
    return function render() {
        with (this) {
            return (foo, bar)
        }
    }
  `,
 map: undefined }


 /**
 * @param { Number 013 }
 * @function generate 
 * 方法入参：
 * 方法出参：
 * 方法总结：
 *    1、
 */
const expression013 = generate(
  createRoot({
    codegenNode: createElementWithCodegen([
      // string
      `"div"`,
      // ObjectExpression
      createObjectExpression(
        [
          createObjectProperty(
            createSimpleExpression(`id`, true, locStub),
            createSimpleExpression(`foo`, true, locStub)
          ),
          createObjectProperty(
            createSimpleExpression(`prop`, false, locStub),
            createSimpleExpression(`bar`, false, locStub)
          ),
          // compound expression as computed key
          createObjectProperty(
            {
              type: 8,
              loc: locStub,
              children: [
                `foo + `,
                createSimpleExpression(`bar`, false, locStub)
              ]
            },
            createSimpleExpression(`bar`, false, locStub)
          )
        ],
        locStub
      ),
      // ChildNode[]
      [
        createElementWithCodegen([
          `"p"`,
          createObjectExpression(
            [
              createObjectProperty(
                // should quote the key!
                createSimpleExpression(`some-key`, true, locStub),
                createSimpleExpression(`foo`, true, locStub)
              )
            ],
            locStub
          )
        ])
      ],
      // flag
      (1 << 4) + ''
    ])
  })
)

const result013 = { ast:
  { type: 0,
    children: [],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
    codegenNode:
     { type: 1,
       loc: [Object],
       ns: 0,
       tag: 'div',
       tagType: 0,
       isSelfClosing: false,
       props: [],
       children: [],
       codegenNode: [Object] },
    loc: 'USELESS2' },
 code:
  `
    return function render() {
      with (this) {
        return _createVNode("div", {
          id: "foo",
          [prop]: bar,
          [foo + bar]: bar
        }, [
          _createVNode("p", { "some-key": "foo" })
        ], 16)
      }
    }
  `,
 map: undefined }


/**
 * @param { Number 014 }
 * @function generate 
 * 方法入参：
 * 方法出参：
 * 方法总结：
 *    1、
 */
const expression014 = generate(
  createRoot({
    codegenNode: createArrayExpression([
      createSimpleExpression(`foo`, false),
      createCallExpression(`bar`, [`baz`])
    ])
  })
)
const result014 = { ast:
  { type: 0,
    children: [],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
    codegenNode: { type: 16, loc: undefined, elements: [Array] },
    loc: 'USELESS2' },
 code:
  `
    return function render() {
      with (this) {
        return [
          foo,
          bar(baz)
        ]
      }
    }
  `,
 map: undefined }


/**
 * @param { Number 015 }
 * @function generate 
 * 方法入参：
 * 方法出参：
 * 方法总结：
 *    1、
 */
const expression015 =  generate(
  createRoot({
    codegenNode: createSequenceExpression([
      createSimpleExpression(`foo`, false),
      createCallExpression(`bar`, [`baz`])
    ])
  })
)
const result015 = { ast:
  { type: 0,
    children: [],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
    codegenNode: { type: 18, expressions: [Array], loc: [Object] },
    loc: 'USELESS2' },
 code:
  `
    return function render() {
      with (this) {
        return (foo, bar(baz))
      }
    }
  `,
 map: undefined }



/**
 * @param { Number 016 }
 * @function generate 
 * 方法入参：
 * 方法出参：
 * 方法总结：
 *    1、
 */
const expression016 = generate(
  createRoot({
    codegenNode: createConditionalExpression(
      createSimpleExpression(`ok`, false),
      createCallExpression(`foo`),
      createConditionalExpression(
        createSimpleExpression(`orNot`, false),
        createCallExpression(`bar`),
        createCallExpression(`baz`)
      )
    )
  })
)
const result016 = { ast:
  { type: 0,
    children: [],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
    codegenNode:
     { type: 19,
       test: [Object],
       consequent: [Object],
       alternate: [Object],
       loc: [Object] },
    loc: 'USELESS2' },
 code:
  `
    return function render() {
      with (this) {
        return ok
        ? foo()
        : orNot
          ? bar()
          : baz()
      }
    }
  `,
 map: undefined }



/**
 * @param { Number 017 }
 * @function generate 
 * 方法入参：
 * 方法出参：
 * 方法总结：
 *    1、
 */
const expression017 = generate(
  createRoot({
    cached: 1,
    codegenNode: createCacheExpression(
      1,
      createSimpleExpression(`foo`, false)
    )
  }),
  {
    mode: 'module',
    prefixIdentifiers: true
  }
)
const result017 = { ast:
  { type: 0,
    children: [],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 1,
    codegenNode:
     { type: 20,
       index: 1,
       value: [Object],
       isVNode: false,
       loc: [Object] },
    loc: 'USELESS2' },
 code:
  `
    export default function render() {
      const _ctx = this
      const _cache = _ctx.$cache
      return _cache[1] || (_cache[1] = foo)
    }
  `,
 map: undefined }


/**
 * @param { Number 018 }
 * @function generate 
 * 方法入参：
 * 方法出参：
 * 方法总结：
 *    1、
 */
const expression018 = generate(
  createRoot({
    cached: 1,
    codegenNode: createCacheExpression(
      1,
      createSimpleExpression(`foo`, false),
      true
    )
  }),
  {
    mode: 'module',
    prefixIdentifiers: true
  }
)
const result018 = { ast:
  { type: 0,
    children: [],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 1,
    codegenNode:
     { type: 20,
       index: 1,
       value: [Object],
       isVNode: true,
       loc: [Object] },
    loc: 'USELESS2' },
 code:
  `
    export default function render() {
      const _ctx = this
      const _cache = _ctx.$cache
      return _cache[1] || (
        setBlockTracking(-1),
        _cache[1] = foo,
        setBlockTracking(1),
        _cache[1]
      )
    }
  `,
 map: undefined }


/**
 * @summary 
 * 总的来说，都是为了
 */

