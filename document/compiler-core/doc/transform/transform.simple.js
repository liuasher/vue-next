

const { NodeTypes } = require('../ast/ast.simple')
const { 
  FRAGMENT, 
  CREATE_BLOCK,
  OPEN_BLOCK
} = require('../runtimeHelpers/runtimeHelpers.simple')


/**
 * 这是对我们在transform测试用例执行过程的简化
 */

function transform(root, options) {
  const context = createTransformContext(root, options)
  traverseNode(root, context)
  // if (options.hoistStatic) {
  //   hoistStatic(root, context)
  // }
  finalizeRoot(root, context)
}

function createTransformContext( root, { nodeTransforms = [] }) {
  // 这里选取了一些会用到的
  const context = {
    root,
    helpers: new Set(),
    nodeTransforms,
    currentNode: root,
    components: new Set(),
    directives: new Set(),
    helper(name) {
      context.helpers.add(name)
      return name
    },
    helperString(name) {
      return (
        (context.prefixIdentifiers ? `` : `_`) +
        helperNameMap[context.helper(name)]
      )
    },
  }
  return context
}

function traverseNode( node, context ) {
  const { nodeTransforms } = context
  const exitFns = []
  for (let i = 0; i < nodeTransforms.length; i++) {

    const onExit = nodeTransforms[i](node, context)
    if (onExit) {
      if (isArray(onExit)) {
        exitFns.push(...onExit)
      } else {
        exitFns.push(onExit)
      }
    }
    node = context.currentNode
  }

  switch (node.type) {
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break
  }

  // exit transforms
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

const isString = (val) => typeof val === 'string'

function traverseChildren( parent, context ) {
  let i = 0
  const nodeRemoved = () => { i-- }
  for (; i < parent.children.length; i++) {
    const child = parent.children[i]
    if (isString(child)) continue
    context.currentNode = child
    context.parent = parent
    context.childIndex = i
    context.onNodeRemoved = nodeRemoved
    traverseNode(child, context)
  }
}


function finalizeRoot(root, context) {
  const { helper } = context
  const { children } = root
  const child = children[0]
  if (children.length === 1) {
    
  } else if (children.length > 1) {
    // root has multiple nodes - return a fragment block.
    root.codegenNode = createBlockExpression(
      createCallExpression(helper(CREATE_BLOCK), [
        helper(FRAGMENT),
        `null`,
        root.children
      ]),
      context
    )
  } else {
    // no children = noop. codegen will return null.
  }
  // finalize meta information
  root.helpers = [...context.helpers]
  root.components = [...context.components]
  root.directives = [...context.directives]
  root.hoists = context.hoists
  root.cached = context.cached
}

const locStub = {
  source: '',
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 }
}

function isSingleElementRoot( root, child ) {
  const { children } = root
  return (
    children.length === 1 &&
    child.type === NodeTypes.ELEMENT &&
    !isSlotOutlet(child)
  )
}

function isSlotOutlet( node ){
  return node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.SLOT
}

function createBlockExpression( blockExp, context ) {
  return createSequenceExpression([
    createCallExpression(context.helper(OPEN_BLOCK)),
    blockExp
  ])
}

function createSequenceExpression( expressions ){
  return {
    type: NodeTypes.JS_SEQUENCE_EXPRESSION,
    expressions,
    loc: locStub
  }
}

function createCallExpression( callee, args, loc ) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    loc,
    callee,
    arguments: args
  }
}

const ast = parse(`<div  v-for="i in list">hello {{ world }}</div>`)

const calls = []
const plugin = (node, context) => {
  calls.push([node, Object.assign({}, context)])
}

transform(ast, {
  nodeTransforms: [plugin]
})


console.log(123, calls.length)