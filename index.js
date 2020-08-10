/*!
 * @rotorsoft/flow
 * Copyright(c) 2020 rotorsoft@outlook.com
 * MIT Licensed
 */
module.exports = ({ actions, params = {}, hooks = {}, invoked, shifted, mutating }) => {
  if (typeof actions !== 'object') throw Error('actions must be an object')
  if (typeof hooks !== 'object') throw Error('hooks must be an object')

  let level = 0
  const stack = []
  const $ = { ...params, $actions: actions }
  Object.keys(hooks).map(name => {
    const hook = hooks[name]
    if (typeof hook !== 'function') throw Error(`hook ${name} must be a function`)
    $[name] = (...args) => {
      const any = hook(state(), ...args)
      if (typeof any === 'function') return any
      if (typeof any === 'object') mutate(any, name)
    }
  })

  const mutate = (state, hook) => {
    if (mutating) mutating(state, hook)
    return Object.keys(state).map(k => ($[k] = Object.assign($[k] || {}, state[k])))
  }
  const state = () => ({ ...$, ...$[$.$scope] }) // TODO deep copy of state to avoid external side effects

  const invoke = (callback, root) => {
    const scope = root || callback.name
    if (!scope && callback !== $.$yield) {
      $.$yield = callback
      return state()
    }
    $.$yield = null

    if (scope && !scope.startsWith('_')) {
      const state = ($[scope] = $[scope] || { $recur: 0 })
      const frame = { $scope: scope, $parent: $.$scope, $level: level, $depth: stack.length }
      frame.$recur = $.$scope === scope ? state.$recur + 1 : 0
      stack.unshift(frame)
      level++
      $.$scope = scope
      Object.assign(state, frame)
    }

    const $value = callback(state())
    if (invoked) invoked(scope, $value, { ...$[$.$scope] })

    if (Array.isArray($value)) stack.unshift(...$value.map(value => ({ $value: value })))
    else stack.unshift({ $value })
    return shift()
  }

  const shift = () => {
    const frame = stack.shift()
    $.$done = !stack.length
    if (!frame) return state()

    if (frame.$scope) {
      level--
      Object.assign($[frame.$scope], frame)
      if (shifted) shifted('RETURN', { ...$[$.$scope] })
      $.$scope = frame.$parent
    } else if (shifted) shifted(frame.$value, { ...$[$.$scope] })
    return next(frame.$value)
  }

  const next = any => {
    if (typeof any === 'function') return invoke(any)
    if (typeof any === 'object') Object.assign($[$.$scope], any)
    return shift()
  }

  return any => {
    if (typeof any === 'function' && !stack.length)
      return invoke(any, !any.name || any.name.startsWith('_') ? '$root' : any.name)
    if (typeof any === 'object') {
      mutate(any)
      return $.$yield ? invoke($.$yield) : shift()
    }
    throw 'invalid operation'
  }
}
