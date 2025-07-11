// .eslintrc.js
module.exports = {
  // 指定这是一个根配置文件，ESLint 不会再向上级目录查找
  root: true, // <--- Corrected: removed the quotes

  // 指定运行环境
  env: {
    es2021: true, // 支持 ES2021 语法
    node: true,   // 支持 Node.js 全局变量和作用域
  },

  // 继承一组推荐的规则
  extends: [
    'eslint:recommended', // 使用 ESLint 官方推荐的规则集
  ],

  // 解析器选项
  parserOptions: {
    ecmaVersion: 'latest', // 使用最新的 ECMAScript 版本
    sourceType: 'module',  // 代码是 ECMAScript 模块
  },

  // 在这里可以自定义或覆盖规则
  // "off" 或 0 - 关闭规则
  // "warn" 或 1 - 将规则视为一个警告
  // "error" 或 2 - 将规则视为一个错误
  rules: {
    // 示例：你可以根据你的团队风格自定义规则
    'no-console': 'warn', // 不禁用 console，但会给出警告
  },
};