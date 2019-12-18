

const source008 = `<div v-for="i in list">hello world</div>`
const { code: code8, map: map8 } = compile(source008, {
  sourceMap: false,
  filename: `foo.vue`
})

const CODE = `
  return function render() {
    with (this) {
      return (
        _openBlock(false), 
        _createBlock(
          _Fragment, 
          null, 
          _renderList(list, (i) => {
            return (
              _openBlock(), 
              _createBlock("div", null, "hello world")
            )
          }), 
          128 /* UNKEYED_FRAGMENT */
        )
      )
    }
  }
`


const CODE = `
return function render() {
    with (this) {
          return (_openBlock(), _createBlock("div", null, "hello world"))
        }
    }`