## 目录
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



## 综述
compiler-core，就是一些简单的template解析，不涉及到标签名，指令名等的合法性校验，
核心是使用递归解析模板，仅保证了标签闭合，前后对称，还有一些编码方面的校验



## 入口
```ts
import { parse, ParserOptions } from './parse'
import { transform, TransformOptions } from './transform'
import { generate, CodegenOptions, CodegenResult } from './codegen'

export function baseCompile(template: string | RootNode, options): CodegenResult {

  const ast = isString(template) ? parse(template, options) : template

  const prefixIdentifiers = !__BROWSER__ && (options.prefixIdentifiers === true || options.mode === 'module')

  transform(ast, {
    ...options,
    prefixIdentifiers,
    nodeTransforms: [
      transformOnce,
      transformIf,
      transformFor,
      transformSlotOutlet,
      transformElement,
      trackSlotScopes,
      transformText,
    ],
    directiveTransforms: {
      on: transformOn,
      bind: transformBind,
      model: transformModel
    }
  })

  return generate(ast, {
    ...options,
    prefixIdentifiers
  })
}
```


## 代码

transform(root: RootNode, options)


```ts
export function transform(root: RootNode, options: TransformOptions) {
  // 创建一个编译的上下文
  const context = createTransformContext(root, options)
  traverseNode(root, context)
  // TODO: hoistStatic什么意思
  if (options.hoistStatic) {
    hoistStatic(root, context)
  }
  finalizeRoot(root, context)
}
```


finalizeRoot

确定根元素，给我们传入的root，增加了若干属性
```ts
function finalizeRoot(root: RootNode, context: TransformContext) {
  const { helper } = context
  const { children } = root
  const child = children[0]
  if (children.length === 1) {
    // if the single child is an element, turn it into a block.
    if (isSingleElementRoot(root, child) && child.codegenNode) {
      // single element root is never hoisted so codegenNode will never be
      // SimpleExpressionNode
      const codegenNode = child.codegenNode as
        | ElementCodegenNode
        | ComponentCodegenNode
        | CacheExpression
      if (codegenNode.type !== NodeTypes.JS_CACHE_EXPRESSION) {
        if (codegenNode.callee === WITH_DIRECTIVES) {
          codegenNode.arguments[0].callee = helper(CREATE_BLOCK)
        } else {
          codegenNode.callee = helper(CREATE_BLOCK)
        }
        root.codegenNode = createBlockExpression(codegenNode, context)
      } else {
        root.codegenNode = codegenNode
      }
    } else {
      // - single <slot/>, IfNode, ForNode: already blocks.
      // - single text node: always patched.
      // root codegen falls through via genNode()
      root.codegenNode = child
    }
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
```