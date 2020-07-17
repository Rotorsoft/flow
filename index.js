/*!
 * @rotorsoft/flow
 * Copyright(c) 2020 rotorsoft@outlook.com
 * MIT Licensed
 */
module.exports = ({ params = {}, activities, invoked = () => {}, shifted = () => {} }) => {
  if (typeof activities !== 'object') throw Error('activities must be an object')
  const $ = { ...params, $activities: activities, $stack: [], $level: 0 }
  $.$activity = $

  const invoke = callback => {
    $.$yield = null
    const any = callback({ ...$, ...$.$activity })
    invoked(callback, any, $)
    $.$level++
    $.$stack.unshift($.$activity.$name)

    if (Array.isArray(any)) {
      $.$stack.unshift(...any)
      return next()
    }
    return next(any)
  }

  const next = any => {
    if (typeof any === 'object') Object.assign($.$activity, any)
    if ($.$yield) return invoke($.$yield)
    if (typeof any === 'function') {
      if (!any.name) {
        // anonymous callbacks yield state back to the caller unless is root
        $.$yield = any
        return $.$stack.length ? $ : invoke(any)
      }
      $.$activity = $[any.name] = $[any.name] || { $name: any.name, $count: 0 }
      $.$activity.$count++
      return invoke(any)
    }

    if (!(any = $.$stack.shift())) return $
    if (typeof any === 'string') {
      $.$activity = $[any]
      $.$level--
    }
    shifted(any, $)
    return next(any)
  }

  return next
}
