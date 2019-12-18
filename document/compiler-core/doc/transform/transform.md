
# transform

### 代码
```js
const ast = parse(`<div v-for="i in list">hello world</div>`)
const calls = []
const plugin = (node, context) => {
  calls.push([node, Object.assign({}, context)])
}
transform(ast, {
  nodeTransforms: [plugin]
})
```


### 对比

transform之前的ast
```js

{
    type: 0,
    children: [{
        type: 1,
        ns: 0,
        tag: 'div',
        tagType: 0,
        props: [{
            type: 7,
            name: 'for',
            exp: {
                type: 4,
                content: 'i in list',
                isStatic: false,
                isConstant: false,
            },
            modifiers: [],
        }],
        isSelfClosing: false,
        children: [{
            type: 2,
            content: 'hello world',
        }],
    }],
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
}


{
    cached: 0,
    codegenNode: {
        type: 1,
        ns: 0,
        tag: 'div',
        tagType: 0,
        props: [{
            type: 7,
            name: 'for',
            exp: {
                type: 4,
                content: 'i in list',
                isStatic: false,
                isConstant: false,
            },
            modifiers: [],
        }],
        isSelfClosing: false,
        children: [{
            type: 2,
            content: 'hello world',
        }],
    }
}
```


### 处理之后多了两个属性
- cached
- codegenNode

看着就像copy了一遍（如果有自定义指令就不一样了）


