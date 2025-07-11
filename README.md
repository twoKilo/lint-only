# Lint-Only

[![NPM version](https://img.shields.io/npm/v/lint-only.svg?style=flat)](https://www.npmjs.com/package/lint-only)
[![Build Status](https://img.shields.io/travis/your-username/lint-only.svg?style=flat)](https://travis-ci.org/your-username/lint-only)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 只对 Git 暂存区中已更改的代码行进行 Lint 检查。

在大型项目中，运行 `eslint` 对整个代码库进行检查可能非常耗时。`lint-only` 工具通过只检查你即将提交的更改，显著提升了 lint 的速度。这使它成为 `pre-commit` Git 钩子的理想选择。

## 为什么选择 Lint-Only?

-   **⚡️ 极速**: 只检查你改动的代码行，而不是整个文件。
-   **🎯 精准**: 精确地从 `git diff` 中定位改动，并过滤出相关的 ESLint 错误。
-   **🤖 自动化友好**: 设计为在 CI/CD 或 Git 钩子中无缝工作。
-   **✅ 零配置 (即将支持)**: 自动使用你项目中的 `.eslintrc` 配置。

## 工作原理

`lint-only` 的工作方式非常巧妙：

1.  它使用 `git diff --staged` 来识别出你暂存的所有文件。
2.  对于每个文件，它会分析 diff 内容，找出被修改或新增的**具体行号**。
3.  然后它会对这些文件运行 ESLint。
4.  最后，它会过滤 ESLint 的输出，只显示那些与你改动的行号相关的警告和错误。

## 安装

```bash
npm install -g lint-only