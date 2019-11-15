# @vue/compiler-core

compiler-core

对字符串解析，完成template -> AST


## 列表

- codeframe.spec
  ```js
    function generateCodeFrame() {

    }
  ```

- codegen.spec
  ```js
    function createRoot() {
      // 跟节点
      return {
        type: NodeTypes.ROOT,
        children: [],
        helpers: [],
        components: [],
        directives: [],
        hoists: [],
        cached: 0,
        codegenNode: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          loc: {
            source: '',
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 1, offset: 0 }
          },
          isConstant: false,
          content: null,
          isStatic: false
        },
        loc: {
          source: '',
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 }
        },
      }
    }
  ```