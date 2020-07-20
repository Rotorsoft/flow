module.exports = ({ $actions, name }) => {
  return [
    $actions.authenticate,
    function count({ check }) {
      return [
        { say: `Please enter ${3 - (check ? check.counter : 0)} number(s)` },
        ({ number }) => [
          { say: `You entered ${number}` },
          function check({ counter = 0 }) {
            if (isNaN(number)) return [{ say: 'which is not a number.', counter }, count]
            counter++
            if (counter < 3)
              return [
                {
                  say: `Got ${counter} number(s)`,
                  counter
                },
                count
              ]
            return { say: 'Thank you.' }
          }
        ]
      ]
    },
    function $root({ authenticate, verifyPhone, canComeToThePhone }) {
      const greet = { say: `Hello ${name}. How are you today?`, authenticated: true }

      if (authenticate.answer === 'yes') return greet
      if (verifyPhone && verifyPhone.answer === 'yes') {
        if (canComeToThePhone && canComeToThePhone.answer && canComeToThePhone.answer !== 'no') return greet
        return { say: `Hi. Please tell ${name} we will be calling back soon.` }
      }
      return { say: "I'm sorry for the inconvenience." }
    }
  ]
}
