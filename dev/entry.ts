import reactiveLocalStorage from '../src'
// import Mocha, { describe, it } from 'mocha'
// import { expect } from 'chai'

inject(window)

function inject(window: any) {
  window.reactiveLocalStorage = reactiveLocalStorage
}

// const mocha = new Mocha({ ui: 'bdd' })

// describe('localStorage', () => {
//   it('localStorage should emit changes', done => {
//     const now = String(Date.now())
//     reactiveLocalStorage.on('change', (key, newValue, oldValue) => {
//       expect(oldValue).to.be.null
//       expect(newValue).to.equal(now)
//       done()
//     })
//     localStorage.setItem(`test-${now}`, now)
//   }).timeout(100)
// })

// mocha.run()
