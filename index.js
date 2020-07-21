/*!
 * @rotorsoft/flow
 * Copyright(c) 2020 rotorsoft@outlook.com
 * MIT Licensed
 */
module.exports = ({ actions, params = {}, hooks = {}, invoked, shifted }) => {
  if (typeof actions !== 'object') throw Error('actions must be an object')
  if (typeof hooks !== 'object') throw Error('hooks must be an object')

  const $ = { ...params, $actions: actions, $name: '$root', $recur: 0, $level: 0, $stack: [] }
  Object.keys(hooks).map(name => {
    const hook = hooks[name]
    if (typeof hook !== 'function') throw Error(`hook ${name} must be a function`)
    $[name] = (...args) => {
      const any = hook(state(), ...args)
      if (typeof any === 'function') return any
      if (typeof any === 'object') mutate(any)
    }
  })
  $.$scope = $

  const mutate = state => Object.keys(state).map(k => ($[k] = Object.assign($[k] || {}, state[k])))
  const state = () => ({ ...$, ...$.$scope })

  const invoke = callback => {
    const name = callback.name || ($.$stack.length ? '' : '$root')
    if (name) {
      if ($.$scope.$name != name) {
        $.$scope = $[name] = $[name] || { $name: name }
        $.$scope.$recur = 1
      } else $.$scope.$recur++
    } else if (callback !== $.$yield) {
      $.$yield = callback
      return state()
    }
    $.$yield = null

    const any = callback(state())
    if (invoked) invoked(name, any, state())
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
    if (!frame) return state()
    if (!frame.$any) $.$level--
    $.$scope = frame.$scope
    if (shifted) shifted(frame, state())
    return next(frame.$any)
  }

  const next = any => {
    if (typeof any === 'function') return invoke(any)
    if (typeof any === 'object') Object.assign($.$scope, any)
    return shift()
  }

  return function (state) {
    if (typeof state === 'function' && !$.$stack.length) return invoke(state)
    else if (typeof state === 'object') {
      mutate(state)
      return $.$yield ? invoke($.$yield) : shift()
    }
    throw 'invalid operation'
  }
}
