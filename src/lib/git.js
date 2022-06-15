import {
  filter,
  flatten,
  map,
  pipe,
  split,
  startsWith,
  uniq,
  tap
} from 'ramda'
import {
  doesNotStartWith,
  firstItemStartsWith,
  splitEveryTime,
} from './functional'

export const getChangedLinesFromHunk = (hunk) => {
  let lineNumber = 0

  return hunk.reduce((changedLines, line) => {
    if (startsWith('@@', line)) {
      lineNumber = Number(line.match(/\+([0-9]+)/)[1]) - 1
      return changedLines
    }
    // 不是删除
    if (doesNotStartWith('-', line)) {
      lineNumber += 1

      if (startsWith('+', line)) {
        return [...changedLines, lineNumber]
      }
    }

    return changedLines
  }, [])
}

export const getHunksFromDiff = pipe(
  split('\n'),
  splitEveryTime(startsWith('@@')),
  filter(firstItemStartsWith('@@')),
  // diff msg
  // tap(pipe(console.log))
)

export const getChangedLinesFromDiff = pipe(
  getHunksFromDiff,
  map(getChangedLinesFromHunk),
  flatten,
  uniq
)
