# _flow_

### A minimalistic functional state machine

This is my attempt to build a functional state machine in less than 100 lines of code without any external dependencies

Borrowing from functional programming, coroutines, and generator functions... this is a "coded by convention" loop that sets the foundation to compose more complex applications by using just three basic constructs:

- **Actions** - Pure functions to encapsulate application logic

- **Scopes** - Persisted state of **named actions**

- **Flow** - A closure that returns a coroutine implementing the loop

### Conventions

- **Scopes** (of **named actions**) are persisted state. The flow state is essentially a map of states indexed by action names

- **Anonymous** actions **yield** the state back to the caller. Think of it as a one-time yielding generator function

- **Actions** can optionally return:

  - An **Object** - to mutate the current scope
  - An **Action** - to allow composition
  - An **Array** of the above - to be executed in order

### The loop

The flow is invoked with a map of actions and some optional state and event hooks (_invoked_, _shifted_ callbacks useful for tracing and debugging)

**_The injected actions map allows composition without hard coupling_**

The returned closure is a coroutine that should be started with a **root action** and successively invoked with events (state mutations) following the Observer pattern. It always returns its state

Actions are internally invoked with a single object argument combining flow state and current scope

The flow keeps track of action recursion, execution stack, and indentation level as part of the state

### Schema

```javascript
flow = {
  // injected at start
  ...params, // initialized state (useful for one time parameters)
  $actions, // actions map

  // internal state
  $stack, // execution stack
  $level, // indentation level
  $yield, // yielding action
  $scope, // the current scope

  // the app state
  ...scopes // map indexed by scope name
}

scope = {
  $name, // action name
  $recur, // recurrence counter
  ...state // state
}
```

### How to use

```javascript
const flow = require('@rotorsoft/flow')

function action1({ name }) {
  return [
    { ask: `Am I speaking with ${name}?` },
    ({ answer, $recur }) => {
      if (answer === 'yes') return
      if ($recur < 2) return action1
    }
  ]
}

const root = ({ $actions, name }) => {
  return [
    $actions.action1,
    function root({ action1 }) {
      if (action1.answer === 'yes') return { say: `Hello ${name}. How are you today?` }
      return { say: "I'm sorry for the inconvenience." }
    }
  ]
}

const next = flow({
  params: { name: 'John Doe' },
  actions: { action1 }
})

let state = next(root) // start root action
state = next({ answer: 'what?' })
state = next({ answer: 'yes' })
console.log(state)
```

### TODO

- Return a deep copy of the state to prevent side effects

### Test

```
npm test
```

The provided tests are self explanatory and should log a trace like this:

```javascript
    √ should authenticate (60ms)
[ 0] root() { // [authenticate({name}), root({authenticate,verifyPhone,canComeToThePhone})]
[ 2]    < authenticate({name})
[ 2]    authenticate() { // [{"ask":"Am I speakin...}, ({answer,$recur})]
[ 4]       < {"ask":"Am I speaking with John Doe?"}
[ 3]       < ({answer,$recur})
[ 3]       > {"answer":"no"}
[ 3]          ⏎ verifyPhone({name})
[ 3]       verifyPhone() { // [{"ask":"Is this the ...}, ({answer,$recur})]
[ 5]          < {"ask":"Is this the correct number for John Doe?"}
[ 4]          < ({answer,$recur})
[ 4]          > {"answer":"yes"}
[ 4]             ⏎ canComeToThePhone({name})
[ 4]          canComeToThePhone() { // [{"ask":"Ok, can John...}, ({answer,$recur})]
[ 6]             < {"ask":"Ok, can John Doe come to the phone?"}
[ 5]             < ({answer,$recur})
[ 5]             > {"answer":"yes"}
[ 5]                ⏎ gotToThePhone({name})
[ 5]             gotToThePhone() { // [{"say":"Please say s...}, ({answer,$recur})]
[ 7]                < {"say":"Please say something when John Doe gets to the phone."}
[ 6]                < ({answer,$recur})
[ 6]                > {}
[ 6]                   ⏎ gotToThePhone({name})
[ 6]                gotToThePhone:2() { // [{"say":"Please say s...}, ({answer,$recur})]
[ 8]                   < {"say":"Please say something when John Doe gets to the phone."}
[ 7]                   < ({answer,$recur})
[ 7]                   > {"answer":"here"}
[ 7]                      ⏎ authenticate({name})
[ 7]                   authenticate() { // [{"ask":"Am I speakin...}, ({answer,$recur})]
[ 9]                      < {"ask":"Am I speaking with John Doe?"}
[ 8]                      < ({answer,$recur})
[ 8]                      > {"answer":"yes"}
[ 8]                         ⏎
[ 7]                   } // authenticate
[ 6]                } // gotToThePhone
[ 5]             } // gotToThePhone
[ 4]          } // canComeToThePhone
[ 3]       } // verifyPhone
[ 2]    } // authenticate
[ 1]    < root({authenticate,verifyPhone,canComeToThePhone})
[ 1]    root:2() {
[ 1]       ⏎ {"say":"Hello John Doe. How are you today?","authenticated":true}
[ 1]    } // root
[ 0] } // root

===
{
  name: 'John Doe',
  '$actions': {
    authenticate: [Function: authenticate],
    verifyPhone: [Function: verifyPhone],
    canComeToThePhone: [Function: canComeToThePhone],
    gotToThePhone: [Function: gotToThePhone]
  },
  '$name': '$root',
  '$recur': 0,
  '$level': 0,
  '$stack': [],
  '$scope': {
    '$name': 'root',
    '$recur': 2,
    say: 'Hello John Doe. How are you today?',
    authenticated: true
  },
  root: {
    '$name': 'root',
    '$recur': 2,
    say: 'Hello John Doe. How are you today?',
    authenticated: true
  },
  '$yield': null,
  authenticate: {
    '$name': 'authenticate',
    '$recur': 1,
    ask: 'Am I speaking with John Doe?',
    answer: 'yes'
  },
  verifyPhone: {
    '$name': 'verifyPhone',
    '$recur': 1,
    ask: 'Is this the correct number for John Doe?',
    answer: 'yes'
  },
  canComeToThePhone: {
    '$name': 'canComeToThePhone',
    '$recur': 1,
    ask: 'Ok, can John Doe come to the phone?',
    answer: 'yes'
  },
  gotToThePhone: {
    '$name': 'gotToThePhone',
    '$recur': 2,
    say: 'Please say something when John Doe gets to the phone.',
    answer: 'here'
  }
}
===
```

---

<div align="right">
 <i>Simplicity is the ultimate sophistication</i>

<small><i>Leonardo da Vinci</i></small>

</div>

---

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

## License

[MIT](https://choosealicense.com/licenses/mit/)
