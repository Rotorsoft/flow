/*!
 * @rotorsoft/flow
 * Copyright(c) 2020 rotorsoft@outlook.com
 * MIT Licensed
 */
module.exports = ({ actions, params = {}, hooks = {}, invoked = () => {}, shifted = () => {} }) => {
  if (typeof actions !== 'object') throw Error('actions must be an object')
  if (typeof hooks !== 'object') throw Error('hooks must be an object')

  const $ = { ...params, $actions: actions, $name: '$root', $recur: 0, $level: 0, $stack: [] }
  Object.keys(hooks).map(name => (typeof hooks[name] === 'function' ? ($[name] = hooks[name]($)) : null))
  $.$scope = $

  const invoke = callback => {
    const name = callback.name || ($.$stack.length ? '' : '$root')
    if (name) {
      if ($.$scope.$name != name) {
        $.$scope = $[name] = $[name] || { $name: name }
        $.$scope.$recur = 1
      } else $.$scope.$recur++
    } else if (callback !== $.$yield) {
      $.$yield = callback
      return { ...$ }
    }
    $.$yield = null

    const any = callback({ ...$, ...$.$scope })
    invoked(name, any, $)
    if (Array.isArray(any)) {
      if (name) {
        $.$level++
        $.$stack.unshift({ $scope: $.$scope })
      }
      $.$stack.unshift(...any.map(value => ({ $scope: $.$scope, $any: value })))
      return shift()
    }
    return next(any)
  }

  const shift = () => {
    const frame = $.$stack.shift()
    if (!frame) return { ...$ }
    if (!frame.$any) $.$level--
    $.$scope = frame.$scope
    shifted(frame, $)
    return next(frame.$any)
  }

  const next = any => {
    if (typeof any === 'function') return invoke(any)
    if (typeof any === 'object') {
      const { $scope, ...state } = any
      const target = $scope ? ($[$scope] = $[$scope] || {}) : $.$scope
      Object.assign(target, state)
    }
    if ($.$yield) return invoke($.$yield)
    return shift()
  }

  return next
}
