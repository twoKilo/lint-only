import meow from 'meow'
import run from './lint-only'

const cli = meow(`
  Usage
    $ lint-only [<diff-input>]
`)

// console.log('cli',cli.input[0])
run(cli.input[0])
