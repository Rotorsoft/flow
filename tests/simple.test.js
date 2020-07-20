const chai = require('chai')
chai.should()

const flow = require('../index')
const { invoked, shifted, yielding, logEvent } = require('../logger')
const root = require('./root')
const anonymous = require('./anonymous')

function authenticate({ name }) {
  return [
    { ask: `Am I speaking with ${name}?` },
    ({ answer, $recur }) => {
      if (answer === 'yes') return
      if (answer === 'no') return verifyPhone
      if ($recur < 2) return authenticate
    }
  ]
}

function verifyPhone({ name }) {
  return [
    { ask: `Is this the correct number for ${name}?` },
    ({ answer, $recur }) => {
      if (answer === 'yes') return canComeToThePhone
      if (answer === 'no') return
      if ($recur < 2) return verifyPhone
    }
  ]
}

function canComeToThePhone({ name }) {
  return [
    { ask: `Ok, can ${name} come to the phone?` },
    ({ answer, $recur }) => {
      if (answer === 'yes') return gotToThePhone
      if (answer === 'no') return
      if ($recur < 2) return canComeToThePhone
    }
  ]
}

function gotToThePhone({ name }) {
  return [
    { say: `Please say something when ${name} gets to the phone.` },
    ({ answer, $recur }) => {
      if (answer) return authenticate
      if ($recur < 10) return gotToThePhone
    }
  ]
}

const play = (events, theroot = root) => {
  const options = {
    params: { name: 'John Doe' },
    actions: { authenticate, verifyPhone, canComeToThePhone, gotToThePhone },
    invoked,
    shifted
  }

  const f = flow(options)
  let state = f(theroot) // start
  yielding(state)
  for (const e of events) {
    logEvent(e)
    state = f(e)
    if (state.$stack.length) yielding(state)
  }

  console.log('\n===')
  console.log(state)
  console.log('===\n')

  return state
}

describe('simple test', () => {
  it('should authenticate', async () => {
    const events = [
      { answer: 'whatever' }, // authenticate
      { answer: 'yes' } // authenticate
    ]
    const $ = play(events)
    $.authenticate.answer.should.equal('yes')
    $.root.authenticated.should.equal(true)
    $.root.say.should.equal('Hello John Doe. How are you today?')
  })

  it('should verify phone', async () => {
    const events = [
      { answer: 'no' }, // authenticate
      { answer: 'yes' }, // correct number?
      { answer: 'yes' }, // come to the phone?
      {}, // waiting got to the phone
      { answer: 'here' }, // got to the phone
      { answer: 'yes' } // authenticate
    ]
    const $ = play(events)
    $.authenticate.answer.should.equal('yes')
    $.authenticate.$recur.should.equal(1)
    $.verifyPhone.answer.should.equal('yes')
    $.canComeToThePhone.answer.should.equal('yes')
    $.gotToThePhone.answer.should.equal('here')
    $.gotToThePhone.$recur.should.equal(2)
    $.root.authenticated.should.equal(true)
    $.root.say.should.equal('Hello John Doe. How are you today?')
  })

  it('should leave message when not available', async () => {
    const events = [
      { answer: 'no' }, // authenticate
      { answer: 'yes' }, // correct number?
      { answer: 'no' } // come to the phone?
    ]
    const $ = play(events)
    $.authenticate.answer.should.equal('no')
    $.verifyPhone.answer.should.equal('yes')
    $.canComeToThePhone.answer.should.equal('no')
    $.root.say.should.equal('Hi. Please tell John Doe we will be calling back soon.')
  })

  it('should apologize', async () => {
    const events = [
      { answer: 'no' }, // authenticate
      { answer: 'what?' }, // correct number?
      { answer: 'no' } // correct number?
    ]
    const $ = play(events)
    $.authenticate.answer.should.equal('no')
    $.verifyPhone.answer.should.equal('no')
    $.root.say.should.equal("I'm sorry for the inconvenience.")
  })
})

describe('anonymous root tests', () => {
  it('should authenticate', async () => {
    const events = [
      { answer: 'whatever' }, // authenticate
      { answer: 'yes' }, // authenticate
      { number: 'abc' },
      { number: '1' },
      { number: '2' },
      { number: 'invalid' },
      { number: '3' }
    ]
    const $ = play(events, anonymous)
    $.authenticate.answer.should.equal('yes')
    $.authenticated.should.equal(true)
    $.say.should.equal('Hello John Doe. How are you today?')
  })
})
