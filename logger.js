const chalk = require('chalk')

const toPrototype = func => {
  const match = func
    .toString()
    .replace(/(function)|((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/gm, '')
    .match(/^[^\(]*\(\s*([^\)]*)\)/m)
  return (func.name || '').concat('(', (match ? match[1] : '').split(','), ')')
}

const toObject = (obj, max = 200) => {
  const str = JSON.stringify(obj)
  return str.substr(0, max).concat(str.length > max ? '...}' : '')
}

const toArray = arr => {
  const str = '['.concat(arr.map(e => toAny(e, { max: 20, color: false })).join(', '), ']')
  return str.length > 100 ? str.slice(0, 50).concat(' ... ', str.slice(-50)) : str
}

const toAny = (any, { max = 200, color = true } = {}) => {
  if (!any) return ''
  if (Array.isArray(any)) return toArray(any)
  if (color)
    return typeof any === 'function'
      ? any.name
        ? chalk.gray(toPrototype(any))
        : chalk.gray(toPrototype(any))
      : chalk.green(toObject(any, max))
  else return typeof any === 'function' ? toPrototype(any) : toObject(any, max)
}

const yielding = level => {
  const indent = '     '.concat(' '.repeat(level * 3))
  process.stdout.write(indent.concat(chalk.red.bold('> ')))
}

const logEvent = e => {
  process.stdout.write(chalk.red(JSON.stringify(e)))
}

const toIndent = (depth, level) => chalk.gray(`[${depth.toString().padStart(2)}] `.concat(' '.repeat(level * 3)))

const invoked = ({ name = '', value, recur, depth, level }) => {
  const indent = toIndent(depth, level)
  const fname = name.concat(recur > 1 ? `:${recur}` : '')
  const header = name ? chalk.yellow(indent.concat(fname, '() {')) : ''

  if (Array.isArray(value)) {
    // action returned array to be pushed in frames
    console.log(header.concat(chalk.grey(' // '.concat(toArray(value)))))
  } else {
    // action returned object or another action
    console.log(header)
    console.log(indent.concat(chalk.cyan('   \u23ce ').concat(toAny(value))))
    if (name && typeof value === 'object')
      console.log(indent.concat(chalk.yellow.bold('} '), chalk.gray('// '.concat(fname))))
  }
}

const shifted = ({ scope, value, recur, depth, level }) => {
  const indent = toIndent(depth, level)
  const fname = scope.concat(recur > 1 ? `:${recur}` : '')
  if (value) {
    // shifted value
    console.log(indent.concat(chalk.gray.bold('< '), toAny(value)))
  } else {
    // returned named action
    console.log(indent.concat(chalk.yellow.bold('} '), chalk.gray('// '.concat(fname))))
  }
}

module.exports = { invoked, shifted, yielding, logEvent }
