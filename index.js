/*!
 * @rotorsoft/flow
 * Copyright(c) 2020 rotorsoft@outlook.com
 * MIT Licensed
 */
module.exports = ({ actions, params = {}, hooks = {}, invoked, shifted }) => {
  if (typeof actions !== 'object') throw Error('actions must be an object')
  if (typeof hooks !== 'object') throw Error('hooks must be an object')

  const stack = []
  const $ = { ...params, $actions: actions, $depth: 0, $level: 0 }
  Object.keys(hooks).map(name => {
    const hook = hooks[name]
    if (typeof hook !== 'function') throw Error(`hook ${name} must be a function`)
    $[name] = (...args) => {
      const any = hook(state(), ...args)
      if (typeof any === 'function') return any
      if (typeof any === 'object') mutate(any)
    }
  })

  const mutate = state => Object.keys(state).map(k => ($[k] = Object.assign($[k] || {}, state[k])))
  const state = () => ({ ...$, ...$[$.$scope] }) // TODO deep copy of state to avoid external side effects

  const invoke = callback => {
    const name = callback.name || (stack.length ? '' : '$root')
    if (name) {
      if ($.$scope != name) {
        const state = ($[name] = $[name] || { $scope: name })
        state.$parent = $.$scope
        state.$recur = 1
        $.$scope = name
      } else $[name].$recur++
    } else if (callback !== $.$yield) {
      $.$yield = callback
      return state()
    }
    $.$yield = null

    const any = callback(state())
    if (invoked) invoked({ name, value: any, recur: $[$.$scope].$recur, depth: stack.length, level: $.$level })

    if (name && any && (Array.isArray(any) || typeof any === 'function')) {
      $.$level++
      stack.unshift({ scope: name })
    }

    if (Array.isArray(any)) {
      stack.unshift(...any.map(value => ({ scope: $.$scope, value })))
      return shift()
    }

    return next(any)
  }

  const shift = () => {
    const frame = stack.shift()
    $.$done = !stack.length
    if (!frame) return state()
    if (!frame.value) $.$level--
    $.$scope = frame.scope
    if (shifted) shifted({ scope: frame.scope, value: frame.value, depth: stack.length, level: $.$level })
    return next(frame.value)
  }

  const next = any => {
    if (typeof any === 'function') return invoke(any)
    if (typeof any === 'object') Object.assign($[$.$scope], any)
    return shift()
  }

  return function (state) {
    if (typeof state === 'function' && !stack.length) return invoke(state)
    else if (typeof state === 'object') {
      mutate(state)
      return $.$yield ? invoke($.$yield) : shift()
    }
    throw 'invalid operation'
  }
}
