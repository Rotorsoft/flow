/*!
 * @rotorsoft/flow
 * Copyright(c) 2020 rotorsoft@outlook.com
 * MIT Licensed
 */
module.exports = ({ actions, params = {}, invoked = () => {}, shifted = () => {} }) => {
  if (typeof actions !== 'object') throw Error('actions must be an object')
  const $ = { ...params, $actions: actions, $name: '$root', $level: 0, $stack: [] }
  $.$scope = $

  const invoke = callback => {
    $.$yield = null
    if (callback.name) {
      if ($.$scope.$name != callback.name) {
        $.$scope = $[callback.name] = $[callback.name] || { $name: callback.name }
        $.$scope.$recur = 1
      } else $.$scope.$recur++
      $.$stack.unshift({ $scope: $.$scope, $root: $.$stack.length === 0 })
    }
    const any = callback({ ...$, ...$.$scope })
    invoked(callback, any, $)
    if (Array.isArray(any)) {
      $.$level++
      $.$stack.unshift(...any.map(value => ({ $scope: $.$scope, $any: value })))
      return shift()
    }
    return next(any)
  }

  const shift = () => {
    const frame = $.$stack.shift()
    if (!frame || frame.$root) return { ...$ }
    if (!frame.$any) $.$level--
    $.$scope = frame.$scope
    shifted(frame, $)
    return next(frame.$any)
  }

  const next = any => {
    if (typeof any === 'object') Object.assign($.$scope, any)
    if ($.$yield) return invoke($.$yield)
    if (typeof any === 'function') {
      if (!any.name && $.$stack.length) {
        $.$yield = any
        return { ...$ }
      }
      return invoke(any)
    }
    return shift()
  }

  return next
}
