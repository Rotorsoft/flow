# flow
### A minimal async state machine with zero dependencies

This is my attempt to build a Javascript asynchronous state machine in about 40 lines of code. It is a basic loop that understands just a few rules but creates the foundation to compose more complex applications. There are only two players here:

* **Activities** - Named pure functions that receive flow state and optionally return updates to their own state and/or callbacks

* **Flow** - A function closure initialized with global state, a map of activities, and optional event hooks. The injected activity map allows activity composition without hard coupling [`See schema`](#schema)

### Rules

1. Activities are **named** pure functions with persisted state. Activities can optionally return the following after performing their work:

    - **state object** - to mutate their own state
    - **callback** - other activity or anonymous async callback
    - or an array of the above

2. The flow keeps track of the current activity: how many times it has been invoked and state mutations [`See schema`](#schema)

3. The flow yields control back to the caller when it hits an anonymous callback

4. All callbacks (named or anonymous) receive an object with flow state combined with the current activity's state [`See schema`](#schema)

5. The flow is started with a root callback and can be successively invoked with new state. It always returns the current state [`See schema`](#schema)

### Schema 

```javascript
 flow = { 
   ...params,     // global initialized state
   $activities,   // activities map (callbacks)
   $stack,        // execution stack (array)
   $level,        // execution nesting level
   $yield,        // yielding callback
   $activity,     // the current activity state
   ...activities  // activity state (map indexed by activity name)
}

activity = {
  $count,         // # times invoked
  ...state        // state
}
```

### Test

```
npm test
```

The provided chai test should be self explanatory and should display the following after successful execution:

```javascript
simple test
[ 0] root { // [authenticate({name}), theEnd({authenticate,verifyPhone,canComeToThePhone})]
[ 2]    < authenticate({name})
[ 2]    authenticate { // [{"ask":"Am I speakin...}, ({answer,$count})]
[ 4]       < {"ask":"Am I speaking with John Doe?"}
[ 3]       < ({answer,$count})
[ 3]       await... {"answer":"whatever"}
[ 3]       ...async {
[ 3]          ⏎ authenticate({name})
[ 4]          authenticate:2 { // [{"ask":"Am I speakin...}, ({answer,$count})]
[ 6]             < {"ask":"Am I speaking with John Doe?"}
[ 5]             < ({answer,$count})
[ 5]             await... {"answer":"yes"}
[ 5]             ...async {
[ 5]                ⏎ 
[ 5]             } // authenticate
[ 4]          } // authenticate
[ 3]       } // authenticate
[ 2]    } // authenticate
[ 1]    < theEnd({authenticate,verifyPhone,canComeToThePhone})
[ 1]    theEnd {
[ 1]       ⏎ {"say":"Hello John Doe. How are you today?","authenticated":true}
[ 1]    } // theEnd
[ 0] } // root

===
{
  name: 'John Doe',
  '$activities': {
    authenticate: [Function: authenticate],
    verifyPhone: [Function: verifyPhone],
    canComeToThePhone: [Function: canComeToThePhone],
    gotToThePhone: [Function: gotToThePhone]
  },
  '$stack': [],
  '$level': 0,
  '$activity': { '$name': 'root', '$count': 1 },
  root: { '$name': 'root', '$count': 1 },
  '$yield': null,
  authenticate: {
    '$name': 'authenticate',
    '$count': 2,
    ask: 'Am I speaking with John Doe?',
    answer: 'yes'
  },
  theEnd: {
    '$name': 'theEnd',
    '$count': 1,
    say: 'Hello John Doe. How are you today?',
    authenticated: true
  }
}
===

    √ should authenticate (138ms)
[ 0] root { // [authenticate({name}), theEnd({authenticate,verifyPhone,canComeToThePhone})]
[ 2]    < authenticate({name})
[ 2]    authenticate { // [{"ask":"Am I speakin...}, ({answer,$count})]
[ 4]       < {"ask":"Am I speaking with John Doe?"}
[ 3]       < ({answer,$count})
[ 3]       await... {"answer":"no"}
[ 3]       ...async {
[ 3]          ⏎ verifyPhone({name})
[ 4]          verifyPhone { // [{"ask":"Is this the ...}, ({answer,$count})]
[ 6]             < {"ask":"Is this the correct number for John Doe?"}
[ 5]             < ({answer,$count})
[ 5]             await... {"answer":"yes"}
[ 5]             ...async {
[ 5]                ⏎ canComeToThePhone({name})
[ 6]                canComeToThePhone { // [{"ask":"Ok, can John...}, ({answer,$count})]
[ 8]                   < {"ask":"Ok, can John Doe come to the phone?"}
[ 7]                   < ({answer,$count})
[ 7]                   await... {"answer":"yes"}
[ 7]                   ...async {
[ 7]                      ⏎ gotToThePhone({name})
[ 8]                      gotToThePhone { // [{"say":"Please say s...}, ({answer,$count})]
[10]                         < {"say":"Please say something when John Doe gets to the phone."}
[ 9]                         < ({answer,$count})
[ 9]                         await... {}
[ 9]                         ...async {
[ 9]                            ⏎ gotToThePhone({name})
[10]                            gotToThePhone:2 { // [{"say":"Please say s...}, ({answer,$count})]
[12]                               < {"say":"Please say something when John Doe gets to the phone."}
[11]                               < ({answer,$count})
[11]                               await... {"answer":"here"}
[11]                               ...async {
[11]                                  ⏎ authenticate({name})
[12]                                  authenticate:2 { // [{"ask":"Am I speakin...}, ({answer,$count})]
[14]                                     < {"ask":"Am I speaking with John Doe?"}
[13]                                     < ({answer,$count})
[13]                                     await... {"answer":"yes"}
[13]                                     ...async {
[13]                                        ⏎ 
[13]                                     } // authenticate
[12]                                  } // authenticate
[11]                               } // gotToThePhone
[10]                            } // gotToThePhone
[ 9]                         } // gotToThePhone
[ 8]                      } // gotToThePhone
[ 7]                   } // canComeToThePhone
[ 6]                } // canComeToThePhone
[ 5]             } // verifyPhone
[ 4]          } // verifyPhone
[ 3]       } // authenticate
[ 2]    } // authenticate
[ 1]    < theEnd({authenticate,verifyPhone,canComeToThePhone})
[ 1]    theEnd {
[ 1]       ⏎ {"say":"Hello John Doe. How are you today?","authenticated":true}
[ 1]    } // theEnd
[ 0] } // root

===
{
  name: 'John Doe',
  '$activities': {
    authenticate: [Function: authenticate],
    verifyPhone: [Function: verifyPhone],
    canComeToThePhone: [Function: canComeToThePhone],
    gotToThePhone: [Function: gotToThePhone]
  },
  '$stack': [],
  '$level': 0,
  '$activity': { '$name': 'root', '$count': 1 },
  root: { '$name': 'root', '$count': 1 },
  '$yield': null,
  authenticate: {
    '$name': 'authenticate',
    '$count': 2,
    ask: 'Am I speaking with John Doe?',
    answer: 'yes'
  },
  verifyPhone: {
    '$name': 'verifyPhone',
    '$count': 1,
    ask: 'Is this the correct number for John Doe?',
    answer: 'yes'
  },
  canComeToThePhone: {
    '$name': 'canComeToThePhone',
    '$count': 1,
    ask: 'Ok, can John Doe come to the phone?',
    answer: 'yes'
  },
  gotToThePhone: {
    '$name': 'gotToThePhone',
    '$count': 2,
    say: 'Please say something when John Doe gets to the phone.',
    answer: 'here'
  },
  theEnd: {
    '$name': 'theEnd',
    '$count': 1,
    say: 'Hello John Doe. How are you today?',
    authenticated: true
  }
}
===

    √ should verify phone (89ms)
[ 0] root { // [authenticate({name}), theEnd({authenticate,verifyPhone,canComeToThePhone})]
[ 2]    < authenticate({name})
[ 2]    authenticate { // [{"ask":"Am I speakin...}, ({answer,$count})]
[ 4]       < {"ask":"Am I speaking with John Doe?"}
[ 3]       < ({answer,$count})
[ 3]       await... {"answer":"no"}
[ 3]       ...async {
[ 3]          ⏎ verifyPhone({name})
[ 4]          verifyPhone { // [{"ask":"Is this the ...}, ({answer,$count})]
[ 6]             < {"ask":"Is this the correct number for John Doe?"}
[ 5]             < ({answer,$count})
[ 5]             await... {"answer":"yes"}
[ 5]             ...async {
[ 5]                ⏎ canComeToThePhone({name})
[ 6]                canComeToThePhone { // [{"ask":"Ok, can John...}, ({answer,$count})]
[ 8]                   < {"ask":"Ok, can John Doe come to the phone?"}
[ 7]                   < ({answer,$count})
[ 7]                   await... {"answer":"no"}
[ 7]                   ...async {
[ 7]                      ⏎ 
[ 7]                   } // canComeToThePhone
[ 6]                } // canComeToThePhone
[ 5]             } // verifyPhone
[ 4]          } // verifyPhone
[ 3]       } // authenticate
[ 2]    } // authenticate
[ 1]    < theEnd({authenticate,verifyPhone,canComeToThePhone})
[ 1]    theEnd {
[ 1]       ⏎ {"say":"Hi. Please tell John Doe we will be calling back soon."}
[ 1]    } // theEnd
[ 0] } // root

===
{
  name: 'John Doe',
  '$activities': {
    authenticate: [Function: authenticate],
    verifyPhone: [Function: verifyPhone],
    canComeToThePhone: [Function: canComeToThePhone],
    gotToThePhone: [Function: gotToThePhone]
  },
  '$stack': [],
  '$level': 0,
  '$activity': { '$name': 'root', '$count': 1 },
  root: { '$name': 'root', '$count': 1 },
  '$yield': null,
  authenticate: {
    '$name': 'authenticate',
    '$count': 1,
    ask: 'Am I speaking with John Doe?',
    answer: 'no'
  },
  verifyPhone: {
    '$name': 'verifyPhone',
    '$count': 1,
    ask: 'Is this the correct number for John Doe?',
    answer: 'yes'
  },
  canComeToThePhone: {
    '$name': 'canComeToThePhone',
    '$count': 1,
    ask: 'Ok, can John Doe come to the phone?',
    answer: 'no'
  },
  theEnd: {
    '$name': 'theEnd',
    '$count': 1,
    say: 'Hi. Please tell John Doe we will be calling back soon.'
  }
}
===

    √ should leave message when not available (48ms)
[ 0] root { // [authenticate({name}), theEnd({authenticate,verifyPhone,canComeToThePhone})]
[ 2]    < authenticate({name})
[ 2]    authenticate { // [{"ask":"Am I speakin...}, ({answer,$count})]
[ 4]       < {"ask":"Am I speaking with John Doe?"}
[ 3]       < ({answer,$count})
[ 3]       await... {"answer":"no"}
[ 3]       ...async {
[ 3]          ⏎ verifyPhone({name})
[ 4]          verifyPhone { // [{"ask":"Is this the ...}, ({answer,$count})]
[ 6]             < {"ask":"Is this the correct number for John Doe?"}
[ 5]             < ({answer,$count})
[ 5]             await... {"answer":"what?"}
[ 5]             ...async {
[ 5]                ⏎ verifyPhone({name})
[ 6]                verifyPhone:2 { // [{"ask":"Is this the ...}, ({answer,$count})]
[ 8]                   < {"ask":"Is this the correct number for John Doe?"}
[ 7]                   < ({answer,$count})
[ 7]                   await... {"answer":"no"}
[ 7]                   ...async {
[ 7]                      ⏎ 
[ 7]                   } // verifyPhone
[ 6]                } // verifyPhone
[ 5]             } // verifyPhone
[ 4]          } // verifyPhone
[ 3]       } // authenticate
[ 2]    } // authenticate
[ 1]    < theEnd({authenticate,verifyPhone,canComeToThePhone})
[ 1]    theEnd {
[ 1]       ⏎ {"say":"I'm sorry for the inconvenience."}
[ 1]    } // theEnd
[ 0] } // root

===
{
  name: 'John Doe',
  '$activities': {
    authenticate: [Function: authenticate],
    verifyPhone: [Function: verifyPhone],
    canComeToThePhone: [Function: canComeToThePhone],
    gotToThePhone: [Function: gotToThePhone]
  },
  '$stack': [],
  '$level': 0,
  '$activity': { '$name': 'root', '$count': 1 },
  root: { '$name': 'root', '$count': 1 },
  '$yield': null,
  authenticate: {
    '$name': 'authenticate',
    '$count': 1,
    ask: 'Am I speaking with John Doe?',
    answer: 'no'
  },
  verifyPhone: {
    '$name': 'verifyPhone',
    '$count': 2,
    ask: 'Is this the correct number for John Doe?',
    answer: 'no'
  },
  theEnd: {
    '$name': 'theEnd',
    '$count': 1,
    say: "I'm sorry for the inconvenience."
  }
}
    '$name': 'verifyPhone',
    '$count': 2,
    ask: 'Is this the correct number for John Doe?',
    answer: 'no'
  },
  theEnd: {
    '$name': 'theEnd',
    '$count': 1,
    say: "I'm sorry for the inconvenience."
  }
}
===

    √ should apologize (65ms)


  4 passing (363ms)
```

---
<div style='text-align:right'>
  <i>Simplicity is the ultimate sophistication</i>
  <br /><small><i>Leonardo da Vinci</i></small>
</div>

---

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

## License

[MIT](https://choosealicense.com/licenses/mit/)