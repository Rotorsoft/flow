/*!
 * @rotorsoft/flow
 * Copyright(c) 2020 rotorsoft@outlook.com
 * MIT Licensed
 */
module.exports = ({ actions, params = {}, reducer, invoked, shifted }) => {
  if (typeof actions !== 'object') throw Error('actions must be an object')
  if (typeof reducer !== 'function') throw Error('reducer must be a function')
  const $ = { state: {}, scope: {}, level: 0, yielding: null, stack: [] }

  const invoke = (callback, root) => {
    const name = root || callback.name
    if (!name && callback !== $.yielding) {
      $.yielding = callback
      return $
    }
    $.yielding = null

    if (name) {
      const recur = $.scope.name === name ? $.scope.recur + 1 : 0
      $.scope = { name, recur, parent: { ...$.scope }, level: $.level++, depth: $.stack.length }
      $.stack.unshift(name)
    }

    const any = callback($.state, $.scope, { params, actions })
    if (invoked) invoked(name, any, $.scope)

    Array.isArray(any) ? $.stack.unshift(...any) : any ? $.stack.unshift(any) : null
    return shift()
  }

  const shift = () => {
    const any = $.stack.shift()
    if (shifted) shifted(any, $.scope)

    $.done = !$.stack.length
    if (!any) return $

    if (typeof any === 'string') {
      $.level--
      $.scope = $.scope.parent
    }
    return next(any)
  }

  const next = any => {
    if (typeof any === 'function') return invoke(any)
    if (typeof any === 'object') $.state = reducer($.state, $.scope, any)
    return shift()
  }

  return any => {
    if (typeof any === 'function' && !$.stack.length) return invoke(any, any.name || '$root')
    if (typeof any === 'object') {
      $.state = reducer($.state, $.scope, any)
      return $.yielding ? invoke($.yielding) : shift()
    }
    throw 'invalid operation'
  }
}
