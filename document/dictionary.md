文本记录

1、NodeTransform
类型声明
```ts
export type NodeTransform = (
  node: RootNode | TemplateChildNode,
  context: TransformContext
) => void | (() => void) | (() => void)[]
```

2、createSimpleExpression
解析NodeTypes.SIMPLE_EXPRESSION节点
```ts
export function createSimpleExpression(
  content: SimpleExpressionNode['content'],
  isStatic: SimpleExpressionNode['isStatic'],
  loc: SourceLocation = locStub,
  isConstant: boolean = false
): SimpleExpressionNode {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    loc,
    isConstant,
    content,
    isStatic
  }
}
```

3、DirectiveTransform
类型声明，
```js
export type DirectiveTransform = (
  dir: DirectiveNode,
  node: ElementNode,
  context: TransformContext,
  // a platform specific compiler can import the base transform and augment
  // it by passing in this optional argument.
  augmentor?: (ret: DirectiveTransformResult) => DirectiveTransformResult
) => DirectiveTransformResult

export interface DirectiveTransformResult {
  props: Property[]
  needRuntime: boolean | symbol
}
```

4、createObjectProperty
解析NodeTypes.JS_PROPERTY节点
```js
export function createObjectProperty(
  key: Property['key'] | string,
  value: Property['value']
): Property {
  return {
    type: NodeTypes.JS_PROPERTY,
    loc: locStub,
    key: isString(key) ? createSimpleExpression(key, true) : key,
    value
  }
}
```

