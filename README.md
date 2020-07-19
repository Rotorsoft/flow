# flow

### A minimalistic functional state machine

This is my attempt to build a functional state machine in less than 100 lines of code without any external dependencies.

Borrowing from functional programming, coroutines, and generator functions... the idea of a loop that understands a couple of conventions but creates the foundation to compose much more complex applications with just three basic constructs:

- **Actions** - Pure functions to encapsulate application logic. Actions receive state and optionally return state updates and/or more actions

- **Scopes** - Persisted state for **named actions**

- **Flow** - A coroutine initialized with a map of actions and some optional state and event hooks (_invoked_, _shifted_ callbacks useful for tracing and debugging)

_The injected actions map allows composition without hard coupling_ [`See schema`](#schema)

### Conventions

- **Scopes** (of **named actions**) have persisted state. The flow state is essentially a map of states indexed by action names

- **Anonymous** actions **yield** control back to the caller. Think of it as a one-time yield generator function

- **Actions** can optionally return:

  - An **Object** - to mutate the current scope
  - An **Action** - to allow composition
  - An **Array** of the above - to be executed in order

### The loop

A flow is a coroutine started with a **root action** than is successively invoked with events (state mutations) following the Observer pattern. It always returns its state [`See schema`](#schema)

Actions are invoked with a single object argument combining flow state and current scope

The flow keeps track of internal variables like how many times a scope has been entered, execution stack, and indentation levels

### Schema

```javascript
flow = {
  ...params, // initialized state (useful for one time parameters)
  $actions, // actions map
  $stack, // execution stack (array)
  $level, // scope indentation level
  $yield, // yielding action
  $scope, // the current scope
  ...scopes // scope state (map indexed by scope name)
}

scope = {
  $count, // # times entered
  ...state // state
}
```

### TODO

- Return a deep copy of the state to prevent side effects

### Test

```
npm test
```

The provided tests are self explanatory and should display the following after successful execution:

```javascript
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
