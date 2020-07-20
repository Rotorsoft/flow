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

const YIELD = chalk.yellow('... (')
const yielding = ({ $stack, $level }) => {
  const indent = toIndent($stack, $level)
  process.stdout.write(indent.concat(YIELD))
}

const logEvent = e => {
  process.stdout.write(chalk.green(JSON.stringify(e)))
}

const toIndent = ($stack, $level) =>
  chalk.gray(`[${$stack.length.toString().padStart(2)}] `.concat(' '.repeat($level * 3)))

const invoked = (callback, any, { $stack, $level, $scope }) => {
  const indent = toIndent($stack, $level)
  const header = callback.name
    ? indent.concat(chalk.yellow(callback.name.concat($scope.$recur > 1 ? `:${$scope.$recur}() {` : '() {')))
    : chalk.yellow(') {')

  if (Array.isArray(any)) {
    // action returned array to be pushed in frames
    console.log(header.concat(chalk.grey(' // '.concat(toArray(any)))))
  } else {
    // action returned object or another action
    console.log(header)
    console.log(indent.concat(chalk.cyan('   \u23ce ').concat(toAny(any))))
    if (callback.name) console.log(indent.concat(chalk.yellow.bold('} '), chalk.gray('// '.concat(callback.name))))
    else console.log(indent.concat(chalk.yellow('} ')))
  }
}

const shifted = ({ $scope, $any }, { $stack, $level }) => {
  const indent = toIndent($stack, $level)
  if ($any) {
    // shifted value
    console.log(indent.concat(chalk.gray.bold('< '), toAny($any)))
  } else {
    // returned named action
    console.log(indent.concat(chalk.yellow.bold('} '), chalk.gray('// '.concat($scope.$name))))
  }
}

module.exports = { invoked, shifted, yielding, logEvent }
