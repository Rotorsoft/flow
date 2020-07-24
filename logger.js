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

const invoked = (name = '', value, { $scope, $recur, $depth, $level }) => {
  const indent = toIndent($depth, $level)
  const scope = $scope.concat($recur ? `:${$recur}` : '')
  const header = name ? chalk.yellow(indent.concat(scope, '() {')) : ''

  if (Array.isArray(value)) console.log(header.concat(chalk.grey(' // '.concat(toArray(value)))))
  else console.log(header)
}

const shifted = (value, { $scope, $level, $recur, $depth }) => {
  if (value === 'RETURN') {
    const indent = toIndent($depth, $level)
    const scope = $scope.concat($recur ? `:${$recur}` : '')
    console.log(indent.concat(chalk.yellow.bold('} '), chalk.gray('// '.concat(scope))))
  } else if (value) {
    const indent = toIndent($depth, $level + 1)
    if (typeof value === 'function') {
      if (!value.name) process.stdout.write(indent.concat(toAny(value), chalk.red.bold(' ... '))) // yielding
    } else console.log(indent.concat(chalk.gray('\u23ce '), toAny(value)))
  }
}

const mutating = (mutation, hook) => {
  const msg = chalk.green.underline(JSON.stringify(mutation))
  hook ? console.log(hook, msg) : process.stdout.write(msg)
}

module.exports = { invoked, shifted, mutating }
