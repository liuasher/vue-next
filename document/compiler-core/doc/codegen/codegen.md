

### 这个方法不复杂，生成代码的，涉及到的几个属性


### push(code)，这样代码的可读性也不错，是我们可以学习的

- helpers
从测试用例中，我们看到，传入了这两个：CREATE_VNODE, RESOLVE_DIRECTIVE
```js
// 有helper
import { createVNode, resolveDirective } from "vue"
return function render() {

}
// 无
return function render() {

}
```

- prefixIdentifiers
是否有前缀标识符
```js
// 有前缀
const _Vue = Vue
return function render() {

}
// 无
const { ... } = Vue
return function render() {

}
```


- mode
返回类型
```js
// function
return function render() {
  with (this) {
    return null
  }
}

// module
export default function render() {
  const _ctx = this
  return null
}
```

- useWithBlock
是否使用with。当没有前缀，而且不是module模式。出于避免与用户定义的属性冲突的目的
```js
const useWithBlock = !prefixIdentifiers && mode !== 'module'
// function mode const declarations should be inside with block
// also they should be renamed to avoid collision with user properties
```


- components: ['Foo']
如果有这个参数，解析如下
```js
return function render() {
  with (this) {
    const _component_Foo = _resolveComponent("Foo")
    return null
  }
}
```


- directives: [ 'my_dir' ]
如果有这个参数，解析如下
```js
return function render() {
  with (this) {
    const _directive_my_dir = _resolveDirective("my_dir")
    return null
  }
}
```