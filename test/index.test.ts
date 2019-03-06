import { expect } from 'chai'
import * as uuidv4 from 'uuid/v4'
import ls, { ReactiveLocalStorageEventMap, version } from '../src'

describe('reactive-localstorage', () => {
  it('get set delete', () => {
    const key = uuidv4()
    expect(ls.getItem(key)).to.equal(null)
    expect(localStorage.getItem(key)).to.equal(null)

    const value = uuidv4()
    ls.setItem(key, value)
    expect(ls.getItem(key)).to.equal(value)
    expect(localStorage.getItem(key)).to.equal(value)

    ls.removeItem(key)
    expect(ls.getItem(key)).to.equal(null)
    expect(localStorage.getItem(key)).to.equal(null)
  })

  it('feed', () => {
    const KEY = uuidv4()
    const VALUE = uuidv4()
    const fn: ReactiveLocalStorageEventMap['change'] = (key, newValue, oldValue) => {
      expect(key).to.equal(KEY)
      expect(newValue).to.equal(VALUE)
      expect(oldValue).to.equal(null)
    }
    ls.on('change', fn)
    ls.feed(KEY, VALUE, null)
    ls.off('change', fn)
  })

  it('feed error', () => {
    const KEY = uuidv4()
    const VALUE = uuidv4()
    const fn: ReactiveLocalStorageEventMap['change'] = () => {
      throw new Error('should swallow')
    }
    ls.on('change', fn)
    ls.feed(KEY, VALUE, null)
    ls.off('change', fn)
  })

  it('emits event on local addtion', () => {
    const KEY = uuidv4()
    const VALUE = uuidv4()
    const fn: ReactiveLocalStorageEventMap['change'] = (key, newValue, oldValue) => {
      expect(key).to.equal(KEY)
      expect(newValue).to.equal(VALUE)
      expect(oldValue).to.equal(null)
    }
    ls.on('change', fn)
    localStorage.setItem(KEY, VALUE)
    ls.off('change', fn)
  })

  it('emits event on local mutation', () => {
    const KEY = uuidv4()
    const VALUE1 = uuidv4()
    const VALUE2 = uuidv4()
    const fn: ReactiveLocalStorageEventMap['change'] = (key, newValue, oldValue) => {
      expect(key).to.equal(KEY)
      expect(newValue).to.equal(VALUE2)
      expect(oldValue).to.equal(VALUE1)
    }
    localStorage.setItem(KEY, VALUE1)
    ls.on('change', fn)
    localStorage.setItem(KEY, VALUE2)
    ls.off('change', fn)
  })

  it('emits event on local deletion', () => {
    const KEY = uuidv4()
    const VALUE = uuidv4()
    const fn: ReactiveLocalStorageEventMap['change'] = (key, newValue, oldValue) => {
      expect(key).to.equal(KEY)
      expect(newValue).to.equal(null)
      expect(oldValue).to.equal(VALUE)
    }
    localStorage.setItem(KEY, VALUE)
    ls.on('change', fn)
    localStorage.removeItem(KEY)
    ls.off('change', fn)
  })

  it('clear', () => {
    const KEY = uuidv4()
    const VALUE = uuidv4()
    localStorage.setItem(KEY, VALUE)
    expect(ls.length).to.greaterThan(0)
    expect(localStorage.length).to.greaterThan(0)
    ls.clear()
    expect(ls.length).to.equal(0)
    expect(localStorage.length).to.equal(0)
  })

  it('key', () => {
    const KEY = uuidv4()
    const VALUE = uuidv4()
    ls.setItem(KEY, VALUE)
    expect(ls.length).to.greaterThan(0)
    expect(ls.key(ls.length - 1)).to.equal(KEY)
  })

  it('version', () => {
    expect(ls.version).to.equal(version)
  })

  it('receives storage event', () => {
    const KEY = uuidv4()
    const VALUE = uuidv4()
    const fn: ReactiveLocalStorageEventMap['change'] = (key, newValue, oldValue) => {
      expect(key).to.equal(KEY)
      expect(newValue).to.equal(null)
      expect(oldValue).to.equal(VALUE)
    }
    ls.on('change', fn)
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: KEY,
        newValue: VALUE,
        oldValue: null,
      })
    )
    ls.off('change', fn)
  })
})
