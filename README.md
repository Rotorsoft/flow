# _flow_

### A minimalistic functional state machine

This is an attempt to build a functional state machine in less than 100 lines of code without any external dependencies. I welcome reviewers who can contribute to make it more efficient without compromising funcionality.

Borrowing from functional programming, coroutines, and generator functions; this "coded by convention" loop sets the foundation to compose more complex applications with just three basic constructs:

- **Actions** - Pure functions with logic to drive transitions

- **Reducer** - Pure function with logic to reduce the state from transitions

- **Flow** - A closure with the coroutine implementing the loop and holding the state

### Conventions

- **Anonymous** actions **yield** the state back to the caller. Think of it as a one-time yielding generator function

- **Actions** can optionally return:

  - An **Object** - the transition payload
  - An **Action** - to allow composition
  - An **Array** of the above - to be executed in order

### The loop

The flow is initialized with a map of actions, optional parameters, the reducer, and optional callbacks (_invoked_, _shifted_) for tracing and debugging actions. **_The injected action map allows composition without coupling modules_**.

The returned coroutine must be started with a **root action** and can be successively invoked with state payloads following the Observer pattern. It always returns its internal structure including the current state and scope.

Actions are internally invoked with 3 arguments: **(state, scope, { params, actions })**.

The flow keeps track of action recursion, indentation, and stack depth levels in the scope object.

### Schema

```javascript
flow = {
  state: {...} // current reduced state
  scope: { // current scope
    name: 'string', // action name
    recur: 'int', // recurrence counter
    parent: {...}, // parent scope
    level: 'int', // indentation level
    depth: 'int' // stack depth
  },
  level: 'int', // current indentation level
  yielding: 'function' // yielding action
  stack: [] // current stack
  done: 'bool', // true when end of stack reached
}
```

### How to use

```javascript
const flow = require('@rotorsoft/flow')

function action1(state, scope, { params }) {
  return [
    { ask: `Am I speaking with ${params.name}?` },
    (state, { recur }) => {
      if (state.action1.answer === 'yes') return
      if (recur < 2) return action1
    }
  ]
}

const root = (state, scope, { params, actions }) => {
  return [
    actions.action1,
    function root(state) {
      if (state.action1.answer === 'yes') return { say: `Hello ${params.name}. How are you today?` }
      return { say: "I'm sorry for the inconvenience." }
    }
  ]
}

const next = flow({
  params: { name: 'John Doe' },
  actions: { action1 },
  reducer: (state, scope, payload) => ({ ...state, ...payload })
})

let $ = next(root) // start root action
$ = next({ action1: { answer: 'what?' } }) // update action1 state
$ = next({ action1: { answer: 'yes' } }) // update action1 state
console.log($)
```

### Test

```
npm test
```

The provided tests are self explanatory and should log a trace like this:

```javascript
  simple test
[ 0] root() { // [authenticate(state,scope,{params}), next({authenticate,verifyPhone,canComeToThePhone})]
[ 2]    authenticate() { // [{"ask":"Am I speakin...}, (state,{recur})]
[ 2]       {"ask":"Am I speaking with John Doe?"}
[ 2]       (state,{recur}) ... {"authenticate":{"answer":"whatever"}}
[ 3]       authenticate:1() { // [{"ask":"Am I speakin...}, (state,{recur})]
[ 3]          {"ask":"Am I speaking with John Doe?"}
[ 3]          (state,{recur}) ... {"authenticate":{"answer":"yes"}}
[ 3]       } // authenticate:1
[ 2]    } // authenticate
[ 1]    next() {
[ 1]       {"say":"Hello John Doe. How are you today?","authenticated":true}
[ 1]    } // next
[ 0] } // root

===
{
  state: {
    ask: 'Am I speaking with John Doe?',
    authenticate: { answer: 'yes' },
    say: 'Hello John Doe. How are you today?',
    authenticated: true
  },
  scope: {},
  level: 0,
  yielding: null,
  stack: [],
  done: true
}
===

    √ should authenticate
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
