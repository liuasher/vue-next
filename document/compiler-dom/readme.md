## compiler-dom

这是compiler-dom的入口方法

```ts
import { baseCompile, CompilerOptions, CodegenResult } from '@vue/compiler-core'
import { parserOptionsMinimal } from './parserOptionsMinimal'
import { parserOptionsStandard } from './parserOptionsStandard'
import { transformStyle } from './transforms/transformStyle'
import { transformCloak } from './transforms/vCloak'
import { transformVHtml } from './transforms/vHtml'
import { transformVText } from './transforms/vText'
import { transformModel } from './transforms/vModel'
import { transformOn } from './transforms/vOn'

export function compile(
  template: string,
  options: CompilerOptions = {}
): CodegenResult {
  return baseCompile(template, {
    ...options,
    ...(__BROWSER__ ? parserOptionsMinimal : parserOptionsStandard),
    nodeTransforms: [transformStyle, ...(options.nodeTransforms || [])],
    directiveTransforms: {
      cloak: transformCloak,
      html: transformVHtml,
      text: transformVText,
      model: transformModel, // override compiler-core
      on: transformOn,
      ...(options.directiveTransforms || {})
    }
  })
}
```


## 简述

compiler-dom, 在compiler-core的基础上
进行进一步的解析
增加了directiveTransforms参数
从main function中可以看出
涉及到了style, v-on, v-model的解析
这里涉及到compiler-core的就不作介绍了



## 功能

1.transformStyle

解析style节点，用解析完成的结果，替换掉prop
```ts
import { NodeTransform, NodeTypes, createSimpleExpression } from '@vue/compiler-core'

export const transformStyle: NodeTransform = (node, context) => {
  if (node.type === NodeTypes.ELEMENT) {
    node.props.forEach((p, i) => {
      if (p.type === NodeTypes.ATTRIBUTE && p.name === 'style' && p.value) {
        // 直接使用节点替换掉props
        const parsed = JSON.stringify(parseInlineCSS(p.value.content))
        const exp = context.hoist(createSimpleExpression(parsed, false, p.loc))
        node.props[i] = {
          type: NodeTypes.DIRECTIVE,
          name: `bind`,
          arg: createSimpleExpression(`style`, true, p.loc),
          exp,
          modifiers: [],
          loc: p.loc
        }
      }
    })
  }
}

const listDelimiterRE = /;(?![^(]*\))/g
const propertyDelimiterRE = /:(.+)/

function parseInlineCSS(cssText: string): Record<string, string> {
  const res: Record<string, string> = {}
  cssText.split(listDelimiterRE).forEach(function(item) {
    if (item) {
      const tmp = item.split(propertyDelimiterRE)
      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim())
    }
  })
  return res
}
```


2.transformCloak

解析v-cloak, v-cloak用于解决{{}}解析闪烁的问题  

TODO: 如何实现
```ts
export const transformCloak: DirectiveTransform = (node, context) => {
  return { props: [], needRuntime: false }
}
```


3.transformVHtml

返回一个DirectiveTransform对象
( v-html是为了输出html, 请防止xss攻击, v-text是为了代替双花括号标签 )
( <div v-text="data"></div> 等同于 <div>{{data}}</div> )

TODO: context.onError后续如何调用, DirectiveTransform作用
```ts
import {
  DirectiveTransform,
  createObjectProperty,
  createSimpleExpression
} from '@vue/compiler-core'
import { createDOMCompilerError, DOMErrorCodes } from '../errors'

export const transformVHtml: DirectiveTransform = (dir, node, context) => {
  const { exp, loc } = dir
  if (!exp) {
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_HTML_NO_EXPRESSION, loc)
    )
  }
  if (node.children.length) {
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_HTML_WITH_CHILDREN, loc)
    )
    node.children.length = 0
  }
  return {
    props: [
      createObjectProperty(
        createSimpleExpression(`innerHTML`, true, loc),
        exp || createSimpleExpression('', true)
      )
    ],
    needRuntime: false
  }
}
```


4.transformVText 

返回一个DirectiveTransform对象
```ts
export const transformVText: DirectiveTransform = (dir, node, context) => {
  const { exp, loc } = dir
  if (!exp) {
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_TEXT_NO_EXPRESSION, loc)
    )
  }
  if (node.children.length) {
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_TEXT_WITH_CHILDREN, loc)
    )
    node.children.length = 0
  }
  return {
    props: [
      createObjectProperty(
        createSimpleExpression(`textContent`, true, loc),
        exp || createSimpleExpression('', true)
      )
    ],
    needRuntime: false
  }
}

```


5.transformModel

返回一个DirectiveTransform对象
```ts
export const transformModel: DirectiveTransform = (dir, node, context) => {
  const baseResult = baseTransform(dir, node, context)
  // base transform has errors
  if (!baseResult.props.length) {
    return baseResult
  }

  const { tag, tagType } = node
  if (tagType === ElementTypes.ELEMENT) {
    if (dir.arg) {
      context.onError(
        createDOMCompilerError(
          DOMErrorCodes.X_V_MODEL_ARG_ON_ELEMENT,
          dir.arg.loc
        )
      )
    }

    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      let directiveToUse = V_MODEL_TEXT
      let isInvalidType = false
      if (tag === 'input') {
        const type = findProp(node, `type`)
        if (type) {
          if (type.type === NodeTypes.DIRECTIVE) {
            // :type="foo"
            directiveToUse = V_MODEL_DYNAMIC
          } else if (type.value) {
            switch (type.value.content) {
              case 'radio':
                directiveToUse = V_MODEL_RADIO
                break
              case 'checkbox':
                directiveToUse = V_MODEL_CHECKBOX
                break
              case 'file':
                isInvalidType = true
                context.onError(
                  createDOMCompilerError(
                    DOMErrorCodes.X_V_MODEL_ON_FILE_INPUT_ELEMENT,
                    dir.loc
                  )
                )
                break
            }
          }
        }
      } else if (tag === 'select') {
        directiveToUse = V_MODEL_SELECT
      }
      // inject runtime directive
      // by returning the helper symbol via needRuntime
      // the import will replaced a resolveDirective call.
      if (!isInvalidType) {
        baseResult.needRuntime = context.helper(directiveToUse)
      }
    } else {
      context.onError(
        createDOMCompilerError(
          DOMErrorCodes.X_V_MODEL_ON_INVALID_ELEMENT,
          dir.loc
        )
      )
    }
  }
  return baseResult
}

```


6.transformOn

返回一个DirectiveTransform对象
```ts
export const transformOn: DirectiveTransform = (dir, node, context) => {
  return baseTransform(dir, node, context, baseResult => {
    const { modifiers } = dir
    if (!modifiers.length) return baseResult

    let { key, value: handlerExp } = baseResult.props[0]

    // modifiers for addEventListener() options, e.g. .passive & .capture
    const eventOptionModifiers = modifiers.filter(isEventOptionModifier)
    // modifiers that needs runtime guards
    const runtimeModifiers = modifiers.filter(m => !isEventOptionModifier(m))

    // built-in modifiers that are not keys
    const nonKeyModifiers = runtimeModifiers.filter(isNonKeyModifier)
    if (nonKeyModifiers.length) {
      handlerExp = createCallExpression(context.helper(V_ON_WITH_MODIFIERS), [
        handlerExp,
        JSON.stringify(nonKeyModifiers)
      ])
    }

    const keyModifiers = runtimeModifiers.filter(m => !isNonKeyModifier(m))
    if (
      keyModifiers.length &&
      // if event name is dynamic, always wrap with keys guard
      (key.type === NodeTypes.COMPOUND_EXPRESSION ||
        !key.isStatic ||
        isKeyboardEvent(key.content))
    ) {
      handlerExp = createCallExpression(context.helper(V_ON_WITH_KEYS), [
        handlerExp,
        JSON.stringify(keyModifiers)
      ])
    }

    if (eventOptionModifiers.length) {
      handlerExp = createObjectExpression([
        createObjectProperty('handler', handlerExp),
        createObjectProperty(
          'options',
          createObjectExpression(
            eventOptionModifiers.map(modifier =>
              createObjectProperty(
                modifier,
                createSimpleExpression('true', false)
              )
            )
          )
        )
      ])
    }

    return {
      props: [createObjectProperty(key, handlerExp)],
      needRuntime: false
    }
  })
}
```



