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
      ? chalk.blue(toPrototype(any))
      : typeof any === 'string'
      ? chalk.cyan(any)
      : chalk.green.dim(toObject(any, max))
  else return typeof any === 'function' ? toPrototype(any) : typeof any === 'string' ? any : toObject(any, max)
}

const YIELD = chalk.blue('await... ')
const yielding = ({ $stack, $level }) => {
  const indent = toIndent($stack, $level)
  process.stdout.write(indent.concat(YIELD))
}

const logEvent = e => {
  console.log(chalk.green.bold(JSON.stringify(e)))
}

const toIndent = ($stack, $level) =>
  chalk.gray(`[${$stack.length.toString().padStart(2)}] `.concat(' '.repeat($level * 3)))

const invoked = (callback, data, { $stack, $level, $activity }) => {
  const indent = toIndent($stack, $level)
  const header = callback.name
    ? indent.concat(chalk.yellow.dim($activity.$name.concat($activity.$count > 1 ? `:${$activity.$count} {` : ' {')))
    : indent.concat(chalk.blue('...async {'))

  if (Array.isArray(data)) console.log(header.concat(chalk.grey(' // '.concat(toArray(data)))))
  else {
    console.log(header)
    console.log(indent.concat(chalk.cyan.bold('   \u23ce ').concat(toAny(data))))
  }
}

const shifted = (data, { $stack, $level }) => {
  if (data) {
    const indent = toIndent($stack, $level)
    if (typeof data === 'string') console.log(indent.concat(chalk.yellow.dim('} '), chalk.gray('// '.concat(data))))
    else console.log(indent.concat(chalk.cyan.bold('< '), toAny(data)))
  }
}

module.exports = { invoked, shifted, yielding, logEvent }
