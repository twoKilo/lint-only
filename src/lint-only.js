import R from 'ramda';
import Promise from 'bluebird';
import exec from 'execa';
import path from 'path';
import { CLIEngine } from 'eslint';
import chalk from 'chalk';

import { pipe, prop, propEq, tap } from 'ramda';
import { getChangedLinesFromDiff } from './lib/git';

const log = (info) => console.log(chalk.hex('#FC8F54').underline.bold(info));

const linter = new CLIEngine({
  rules: {
    'no-console': 'error',
    'object-curly-spacing': ['error', 'always'],
  },
});
const formatter = linter.getFormatter();
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
  R.map(path.resolve),
  tap(pipe(log))
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
    tap(pipe(console.log))
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

    // console.log('changedLines',changedLines)

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
    tap(pipe(console.log)),
    filterLinterMessages(changedFileLineMap),
    tap(pipe(console.log)),
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

const run = (config = {}) =>
  Promise.resolve(config)
    .then(getChangedFiles)
    .map(getChangedFileLineMap)
    .then(applyLinter)
    .then(reportResults);

export default run;
