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
        : chalk.red(toPrototype(any))
      : chalk.green(toObject(any, max))
  else return typeof any === 'function' ? toPrototype(any) : toObject(any, max)
}

const toIndent = (depth, level) => {
  return chalk.gray(`[${depth.toString().padStart(2)}] `.concat(' '.repeat(level * 3)))
}

const invoked = (name = '', value, { recur, depth, level }) => {
  const indent = toIndent(depth, level)
  const array = Array.isArray(value) ? chalk.grey(' // '.concat(toArray(value))) : ''
  if (name) console.log(chalk.yellow(indent.concat(name.concat(recur ? `:${recur}` : ''), '() {', array)))
  else if (array) console.log(chalk.red(indent.concat('   ...', array)))
}

const shifted = (value, { name, level, recur, depth }) => {
  if (typeof value === 'string') {
    const indent = toIndent(depth, level)
    const scope = name.concat(recur ? `:${recur}` : '')
    console.log(indent.concat(chalk.yellow.bold('} '), chalk.gray('// '.concat(scope))))
  } else if (value) {
    const indent = toIndent(depth, level + 1)
    if (typeof value === 'function') {
      if (!value.name) process.stdout.write(indent.concat(toAny(value), chalk.red.bold(' ... '))) // yielding
    } else console.log(indent.concat(toAny(value)))
  }
}

module.exports = { invoked, shifted }
