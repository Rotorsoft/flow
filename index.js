/*!
 * @rotorsoft/flow
 * Copyright(c) 2020 rotorsoft@outlook.com
 * MIT Licensed
 */
module.exports = ({ actions, params = {}, invoked = () => {}, shifted = () => {} }) => {
  if (typeof actions !== 'object') throw Error('actions must be an object')
  const $ = { ...params, $actions: actions, $stack: [], $level: 0 }
  $.$scope = $

  const invoke = callback => {
    $.$yield = null
    const any = callback({ ...$, ...$.$scope })
    invoked(callback, any, $)
    $.$level++
    $.$stack.unshift($.$scope.$name)

    if (Array.isArray(any)) {
      $.$stack.unshift(...any)
      return next()
    }
    return next(any)
  }

  const next = any => {
    if (typeof any === 'object') Object.assign($.$scope, any)
    if ($.$yield) return invoke($.$yield)
    if (typeof any === 'function') {
      if (!any.name) {
        // anonymous callbacks yield state back to the caller unless is root
        $.$yield = any
        return $.$stack.length ? $ : invoke(any)
      }
      $.$scope = $[any.name] = $[any.name] || { $name: any.name, $count: 0 }
      $.$scope.$count++
      return invoke(any)
    }

    if (!(any = $.$stack.shift())) return $
    if (typeof any === 'string') {
      $.$scope = $[any]
      $.$level--
    }
    shifted(any, $)
    return next(any)
  }

  return next
}
