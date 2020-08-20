const chalk = require('chalk')
const chai = require('chai')
chai.should()

const flow = require('../index')
const { invoked, shifted } = require('../logger')
const root = require('./root')
const anonymous = require('./anonymous')

const reducer = (state, scope, payload) => {
  return { ...state, ...payload }
}

function authenticate(state, scope, { params }) {
  return [
    { ask: `Am I speaking with ${params.name}?` },
    (state, { recur }) => {
      const answer = state.authenticate.answer
      if (answer === 'yes') return
      if (answer === 'no') return verifyPhone
      if (recur < 2) return authenticate
    }
  ]
}

function verifyPhone(state, scope, { params }) {
  return [
    { ask: `Is this the correct number for ${params.name}?` },
    (state, { recur }) => {
      const answer = state.verifyPhone.answer
      if (answer === 'yes') return canComeToThePhone
      if (answer === 'no') return
      if (recur < 2) return verifyPhone
    }
  ]
}

function canComeToThePhone(state, scope, { params }) {
  return [
    { ask: `Ok, can ${params.name} come to the phone?` },
    (state, { recur }) => {
      const answer = state.canComeToThePhone.answer
      if (answer === 'yes') return gotToThePhone
      if (answer === 'no') return
      if (recur < 2) return canComeToThePhone
    }
  ]
}

function gotToThePhone(state, scope, { params }) {
  return [
    { say: `Please say something when ${params.name} gets to the phone.` },
    (state, { recur }) => {
      const answer = (state.gotToThePhone || {}).answer
      if (answer) return authenticate
      if (recur < 10) return gotToThePhone
    }
  ]
}

const play = (events, theroot = root) => {
  const options = {
    params: { name: 'John Doe' },
    actions: { authenticate, verifyPhone, canComeToThePhone, gotToThePhone },
    reducer,
    invoked,
    shifted
  }

  const next = flow(options)
  let $ = next(theroot) // start
  for (const e of events) {
    console.log(chalk.green.underline(JSON.stringify(e)))
    $ = next(e)
    // console.log($)
  }

  console.log('\n===')
  console.log($)
  console.log('===\n')

  return $
}

describe('simple test', () => {
  it('should authenticate', async () => {
    const events = [{ authenticate: { answer: 'whatever' } }, { authenticate: { answer: 'yes' } }]
    const $ = play(events)
    $.state.authenticate.answer.should.equal('yes')
    $.state.authenticated.should.equal(true)
    $.state.say.should.equal('Hello John Doe. How are you today?')
  })

  it('should verify phone', async () => {
    const events = [
      { authenticate: { answer: 'no' } },
      { verifyPhone: { answer: 'yes' } },
      { canComeToThePhone: { answer: 'yes' } },
      {}, // waiting got to the phone
      { gotToThePhone: { answer: 'here' } },
      { authenticate: { answer: 'yes' } }
    ]
    const $ = play(events)
    $.state.authenticate.answer.should.equal('yes')
    $.state.verifyPhone.answer.should.equal('yes')
    $.state.canComeToThePhone.answer.should.equal('yes')
    $.state.gotToThePhone.answer.should.equal('here')
    $.state.authenticated.should.equal(true)
    $.state.say.should.equal('Hello John Doe. How are you today?')
  })

  it('should leave message when not available', async () => {
    const events = [
      { authenticate: { answer: 'no' } },
      { verifyPhone: { answer: 'yes' } },
      { canComeToThePhone: { answer: 'no' } }
    ]
    const $ = play(events)
    $.state.authenticate.answer.should.equal('no')
    $.state.verifyPhone.answer.should.equal('yes')
    $.state.canComeToThePhone.answer.should.equal('no')
    $.state.say.should.equal('Hi. Please tell John Doe we will be calling back soon.')
  })

  it('should apologize', async () => {
    const events = [
      { authenticate: { answer: 'no' } },
      { verifyPhone: { answer: 'what?' } },
      { verifyPhone: { answer: 'no' } }
    ]
    const $ = play(events)
    $.state.authenticate.answer.should.equal('no')
    $.state.verifyPhone.answer.should.equal('no')
    $.state.say.should.equal("I'm sorry for the inconvenience.")
  })
})

describe('anonymous root tests', () => {
  it('should authenticate', async () => {
    const events = [
      { authenticate: { answer: 'whatever' } },
      { authenticate: { answer: 'yes' } },
      { count: { number: 'abc' } },
      { count: { number: '1' } },
      { count: { number: '2' } },
      { count: { number: 'invalid' } },
      { count: { number: '3' } }
    ]
    const $ = play(events, anonymous)
    $.state.authenticate.answer.should.equal('yes')
    $.state.authenticated.should.equal(true)
    $.state.say.should.equal('Hello John Doe. How are you today?')
  })
})
