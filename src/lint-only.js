import R from 'ramda';
import exec from 'execa';
import path from 'path';
import { ESLint } from 'eslint';
import chalk from 'chalk';

import { pipe, prop, propEq, tap, endsWith } from 'ramda';
import {getChangedLinesFromDiff} from './lib/git';

const applyAutoFix = async (results) => {
  await CLIEngine.outputFixes(results);
  return results
}

const log = (info) => console.log(chalk.hex('#FC8F54').underline.bold(info));

const eslint = new ESLint(); // 默认使用 .eslintrc

// 获取 formatter 需要异步进行
const getFormatter = async () => {
  return await eslint.loadFormatter('stylish');
};

const fileNeedsToLint = [endsWith('.js'), endsWith('.jsx'), endsWith('.ts'),endsWith('.tsx')];

const getChangedFiles = R.pipeP(
  () =>
    exec('git', [
      'diff',
      'HEAD',
      '--name-only',
      '--staged',
      '--diff-filter=ACM',
    ]),
  prop('stdout'),
  R.split('\n'),
  // tap(pipe(log)),
  R.filter(R.anyPass(fileNeedsToLint)),
  // tap(pipe(log)),
  
  R.map(path.resolve),
);

const getDiff = R.curry((filename) =>
  exec('git', ['diff', 'HEAD', filename]).then(prop('stdout'))
);

const getChangedFileLineMap = R.curry((filePath) =>
  R.pipeP(
    getDiff(),
    getChangedLinesFromDiff,
    R.objOf('changedLines'),
    // add new key
    R.assoc('filePath', filePath),
    // tap(pipe(console.log))
  )(filePath)
);

const lintChangedLines = pipe(
  R.map(prop('filePath')),
  linter.executeOnFiles.bind(linter),
);

const filterLinterMessages = (changedFileLineMap) => (linterOutput) => {
  const filterMessagesByFile = (result) => {
    const fileLineMap = R.find(
      propEq('filePath', result.filePath),
      changedFileLineMap
    );
    // get all changed lines
    const changedLines = prop('changedLines', fileLineMap) || [];

    // console.log('whole lint result',result)
    // exclude un-relevant lines
    const filterMessages = R.evolve({
      messages: R.filter((message) => changedLines.includes(message.line)),
    });
    // console.log('filterMessages',result)
    return filterMessages(result);
  };

  const countBySeverity = (severity) =>
    pipe(R.filter(propEq('severity', severity)), R.length);

  const countWarningMessages = countBySeverity(1);
  const countErrorMessages = countBySeverity(2);
  
  const warningCount = (result) => {
    const transform = {
      warningCount: countWarningMessages(result.messages),
    };

    return R.merge(result, transform);
  };

  const errorCount = (result) => {
    const errorCountProp = {
      errorCount: countErrorMessages(result.messages),
    };

    return R.merge(result, errorCountProp);
  };

  return pipe(
    prop('results'),
    R.map(pipe(filterMessagesByFile, warningCount, errorCount)),
    R.objOf('results')
  )(linterOutput);
};

const applyLinter = (changedFileLineMap) =>
  pipe(
    lintChangedLines,
    // tap(pipe(console.log)),
    filterLinterMessages(changedFileLineMap),
    // tap(pipe(console.log)),
  )(changedFileLineMap);

const logResults = pipe(prop('results'), formatter, log);

const getErrorCountFromReport = pipe(
  prop('results'),
  R.pluck('errorCount'),
  R.sum
);

const exitProcess = R.curryN(2, (n) => process.exit(n));

const reportResults = pipe(
  tap(logResults),
  getErrorCountFromReport,
  // conditionals
  R.cond([
    [R.equals(0), exitProcess(0)],
    [R.T, exitProcess(1)],
  ])
);

const runOld = (config = {}) =>
  Promise.resolve(config)
    .then(getChangedFiles)
    .map(getChangedFileLineMap)
    .then(applyLinter)
    .then(reportResults);


const run = async (config = {}) => {
  try {
    console.log(chalk.hex('#FC8F54')('🔍 Finding changed files...'));
    const changedFiles = await getChangedFiles(config);

    if (changedFiles.length === 0) {
      console.log(chalk.green('✅ No changed files to lint. All good!'));
      process.exit(0);
    }

    console.log(chalk.hex('#FC8F54')('📝 Getting diff information...'));
    const changedFileLineMap = await Promise.all(changedFiles.map(getChangedFileLineMap));

    console.log(chalk.hex('#FC8F54')('⚡️ Running ESLint...'));
    const results = await eslint.lintFiles(changedFileLineMap.map(f => f.filePath));

    // 过滤结果，只保留改动行的错误
    const filteredResults = results.map(result => {
      const fileInfo = changedFileLineMap.find(f => f.filePath === result.filePath);
      const changedLines = fileInfo ? fileInfo.changedLines : [];

      result.messages = result.messages.filter(message => changedLines.includes(message.line));

      // 重新计算错误和警告数量
      result.errorCount = result.messages.filter(m => m.severity === 2).length;
      result.warningCount = result.messages.filter(m => m.severity === 1).length;

      return result;
    }).filter(result => result.messages.length > 0);

    if (filteredResults.length === 0) {
      console.log(chalk.green('✅ Linting passed on all changed lines!'));
      process.exit(0);
    }

    console.log(chalk.red.bold('\n🚨 Linting finished with errors:'));
    const formatter = await getFormatter();
    const resultText = formatter.format(filteredResults);
    console.log(resultText);

    // 如果有错误，则以失败状态退出
    const totalErrors = filteredResults.reduce((acc, r) => acc + r.errorCount, 0);
    if (totalErrors > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }

  } catch (error) {
    console.error(chalk.red('An unexpected error occurred:'), error);
    process.exit(1);
  }
};
export default run;
