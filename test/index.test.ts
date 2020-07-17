import { expect } from 'chai'
import * as uuidv4 from 'uuid/v4'
import { ReactiveLocalStorageEventMap, version, LocalStorage } from '../src'

describe('reactive-localstorage', () => {
  it('not inject on setItem()', () => {
    const ls = new LocalStorage(window, localStorage)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false

    const key = uuidv4()
    const value = uuidv4()
    ls.setItem(key, value)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false
  })

  it('not inject on removeItem()', () => {
    const ls = new LocalStorage(window, localStorage)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false

    const key = uuidv4()
    ls.removeItem(key)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false
  })

  it('not inject on clear()', () => {
    const ls = new LocalStorage(window, localStorage)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false

    ls.clear()

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false
  })

  it('not inject on off()', () => {
    const ls = new LocalStorage(window, localStorage)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false

    ls.off('change', () => null)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false
  })

  it('not inject on feed()', () => {
    const ls = new LocalStorage(window, localStorage)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false

    const key = uuidv4()
    const value1 = uuidv4()
    const value2 = uuidv4()
    ls.feed(key, value1, value2)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false
  })

  it('inject on getItem()', () => {
    const ls = new LocalStorage(window, localStorage)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false

    const key = uuidv4()
    ls.getItem(key)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.true
  })

  it('inject on on()', () => {
    const ls = new LocalStorage(window, localStorage)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.false

    ls.on('change', () => null)

    expect((ls as {} as { readonly _injected?: unknown })._injected).to.be.true
  })

  it('get set delete', () => {
    const ls = new LocalStorage(window, localStorage)

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
    const ls = new LocalStorage(window, localStorage)

    const KEY = uuidv4()
    const VALUE = uuidv4()
    let ret: ReturnType<typeof runSafeSync> | undefined
    const fn: ReactiveLocalStorageEventMap['change'] = (key, newValue, oldValue) => {
      ret = runSafeSync(() => {
        expect(key).to.equal(KEY)
        expect(newValue).to.equal(VALUE)
        expect(oldValue).to.equal(null)
      })
    }
    ls.on('change', fn)
    ls.feed(KEY, VALUE, null)
    ls.off('change', fn)

    expect(ret).to.be.an('object')
    expect(ret!.kind).to.equal('result', ret!.error)

    // feed doesn't trigger setItem
    expect(localStorage.getItem(KEY)).to.equal(null)
  })

  it('feed clear', () => {
    const ls = new LocalStorage(window, localStorage)

    const KEY = uuidv4()
    const VALUE = uuidv4()
    localStorage.setItem(KEY, VALUE)

    let ret: ReturnType<typeof runSafeSync> | undefined
    const fn: ReactiveLocalStorageEventMap['change'] = (key, newValue, oldValue) => {
      ret = runSafeSync(() => {
        expect(key).to.equal(null)
        expect(newValue).to.equal(null)
        expect(oldValue).to.equal(null)
      })
    }
    ls.on('change', fn)
    ls.feed(null, null, null)
    ls.off('change', fn)

    expect(ret).to.be.an('object')
    expect(ret!.kind).to.equal('result', ret!.error)

    // feed doesn't trigger clear
    expect(localStorage.getItem(KEY)).to.equal(VALUE)
  })

  it('feed error', () => {
    const ls = new LocalStorage(window, localStorage)

    const KEY = uuidv4()
    const VALUE = uuidv4()
    const fn: ReactiveLocalStorageEventMap['change'] = () => {
      throw new Error('should swallow')
    }
    ls.on('change', fn)
    ls.feed(KEY, VALUE, null)
    ls.off('change', fn)
  })

  it('feed clear error', () => {
    const ls = new LocalStorage(window, localStorage)

    const KEY = uuidv4()
    const VALUE = uuidv4()
    ls.setItem(KEY, VALUE)
    const fn: ReactiveLocalStorageEventMap['change'] = () => {
      throw new Error('should swallow')
    }
    ls.on('change', fn)
    ls.feed(null, null, null)
    ls.off('change', fn)
  })

  it('emits event on local addtion', () => {
    const ls = new LocalStorage(window, localStorage)

    const KEY = uuidv4()
    const VALUE = uuidv4()

    let ret: ReturnType<typeof runSafeSync> | undefined
    const fn: ReactiveLocalStorageEventMap['change'] = (key, newValue, oldValue) => {
      ret = runSafeSync(() => {
        expect(key).to.equal(KEY)
        expect(newValue).to.equal(VALUE)
        expect(oldValue).to.equal(null)
      })
    }

    ls.on('change', fn)
    localStorage.setItem(KEY, VALUE)
    ls.off('change', fn)

    expect(ret).to.be.an('object')
    expect(ret!.kind).to.equal('result', ret!.error)
  })

  it('emits event on local mutation', () => {
    const ls = new LocalStorage(window, localStorage)

    const KEY = uuidv4()
    const VALUE1 = uuidv4()
    const VALUE2 = uuidv4()

    let ret: ReturnType<typeof runSafeSync> | undefined
    const fn: ReactiveLocalStorageEventMap['change'] = (key, newValue, oldValue) => {
      ret = runSafeSync(() => {
        expect(key).to.equal(KEY)
        expect(newValue).to.equal(VALUE2)
        expect(oldValue).to.equal(VALUE1)
      })
    }

    localStorage.setItem(KEY, VALUE1)
    ls.on('change', fn)
    localStorage.setItem(KEY, VALUE2)
    ls.off('change', fn)

    expect(ret).to.be.an('object')
    expect(ret!.kind).to.equal('result', ret!.error)
  })

  it('emits event on local deletion', () => {
    const ls = new LocalStorage(window, localStorage)

    const KEY = uuidv4()
    const VALUE = uuidv4()

    let ret: ReturnType<typeof runSafeSync> | undefined
    const fn: ReactiveLocalStorageEventMap['change'] = (key, newValue, oldValue) => {
      ret = runSafeSync(() => {
        expect(key).to.equal(KEY)
        expect(newValue).to.equal(null)
        expect(oldValue).to.equal(VALUE)
      })
    }

    localStorage.setItem(KEY, VALUE)
    ls.on('change', fn)
    localStorage.removeItem(KEY)
    ls.off('change', fn)

    expect(ret).to.be.an('object')
    expect(ret!.kind).to.equal('result', ret!.error)
  })

  it('clear', () => {
    const ls = new LocalStorage(window, localStorage)

    const cache = (ls as {} as { _cache: Map<unknown, unknown> })._cache

    expect(cache.size).to.equal(0)

    const KEY = uuidv4()
    const VALUE = uuidv4()
    localStorage.setItem(KEY, VALUE)
    expect(ls.getItem(KEY)).to.equal(VALUE)

    expect(cache.size).to.equal(1)

    expect(ls.length).to.greaterThan(0)
    expect(localStorage.length).to.greaterThan(0)
    ls.clear()
    expect(ls.length).to.equal(0)
    expect(localStorage.length).to.equal(0)
    expect(localStorage.getItem(KEY)).equal(null)

    expect(cache.size).to.equal(1)
    expect(cache.get(KEY)).to.equal(null)
  })

  it('native clear', () => {
    const ls = new LocalStorage(window, localStorage)

    const cache = (ls as {} as { _cache: Map<unknown, unknown> })._cache

    expect(cache.size).to.equal(0)

    const KEY = uuidv4()
    const VALUE = uuidv4()
    localStorage.setItem(KEY, VALUE)
    expect(ls.getItem(KEY)).to.equal(VALUE)

    expect(cache.size).to.equal(1)

    expect(ls.length).to.greaterThan(0)
    expect(localStorage.length).to.greaterThan(0)
    localStorage.clear()

    expect(ls.length).to.equal(0)
    expect(localStorage.length).to.equal(0)
    expect(localStorage.getItem(KEY)).equal(null)

    expect(cache.size).to.equal(1)
    expect(cache.get(KEY)).to.equal(null)
  })

  it('key', () => {
    const ls = new LocalStorage(window, localStorage)

    const KEY = uuidv4()
    const VALUE = uuidv4()
    ls.setItem(KEY, VALUE)
    expect(ls.length).to.greaterThan(0)
    expect(ls.key(ls.length - 1)).to.equal(KEY)
  })

  it('version', () => {
    const ls = new LocalStorage(window, localStorage)

    expect(ls.version).to.equal(version)
  })

  it('receives storage event', () => {
    const ls = new LocalStorage(window, localStorage)

    const KEY = uuidv4()
    const VALUE = uuidv4()

    let ret: ReturnType<typeof runSafeSync> | undefined
    const fn: ReactiveLocalStorageEventMap['change'] = (key, newValue, oldValue) => {
      ret = runSafeSync(() => {
        expect(key).to.equal(KEY)
        expect(newValue).to.equal(VALUE)
        expect(oldValue).to.equal(null)
      })
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

    expect(ret).to.be.an('object')
    expect(ret!.kind).to.equal('result', ret!.error)
  })
})

function runSafeSync<T>(fn: () => T) {
  try {
    const result = fn()
    return { kind: 'result' as const, result }
  } catch (error) {
    return { kind: 'error' as const, error }
  }
}
