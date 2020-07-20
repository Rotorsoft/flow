module.exports = ({ $actions, name, $msgHook }) => {
  return [
    $actions.authenticate,
    function count({ summary = { counter: 0 } }) {
      return [
        { say: `Please enter ${3 - summary.counter} number(s)` },
        ({ number }) => [
          { say: `You entered ${number}` },
          function check({ summary = { counter: 0 } }) {
            let counter = summary.counter
            if (isNaN(number)) return [{ $scope: 'summary', say: 'which is not a number.', counter }, count]
            $msgHook('incrementing counter')
            counter++
            if (counter < 3)
              return [
                {
                  $scope: 'summary',
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
