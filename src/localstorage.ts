const $injectMark = Symbol.for('reactive-localstorage-inject-mark')
const $handlers = Symbol.for('reactive-localstorage-handlers')

const { getItem, setItem, removeItem } = Storage.prototype

export class LocalStorage implements Storage {
  readonly supported: boolean
  readonly native: Storage

  protected _events: {
    [P in keyof ReactiveLocalStorageEventMap]?: Set<ReactiveLocalStorageEventMap[P]>
  } = {}
  protected _cache: Map<string, string | null>
  protected _length = 0

  constructor(window?: Window, storage?: Storage) {
    if (window) {
      this.supported = true
    } else {
      this.supported = false
      window = new Window()
    }
    this.native = storage || window.localStorage
    this._cache = new Map()
    this.inject(this.native)
    listen(window, ({ key, newValue, oldValue }) => {
      if (!key) return
      this.feed(key, newValue, oldValue)
    })
  }

  get length() {
    return this.native.length
  }

  key(index: number) {
    return this.native.key(index)
  }

  getItem(key: string) {
    const cache = this._cache
    if (cache.has(key)) return cache.get(key)!
    const value = call(getItem, this.native, key)
    cache.set(key, value)
    return value
  }

  setItem(key: string, value: string) {
    return this.set(key, value)
  }

  removeItem(key: string) {
    return this.set(key, null)
  }

  clear() {
    this.native.clear()
    const cache = this._cache
    for (const key of cache.keys()) {
      cache.set(key, null)
    }
  }

  on<K extends keyof ReactiveLocalStorageEventMap>(name: K, fn: ReactiveLocalStorageEventMap[K]) {
    let set = this._events[name]
    if (!set) {
      this._events[name] = set = new Set()
    }
    set.add(fn)
  }

  off<K extends keyof ReactiveLocalStorageEventMap>(name: K, fn: ReactiveLocalStorageEventMap[K]) {
    const set = this._events[name]
    if (set) {
      set.delete(fn)
    }
  }

  feed(key: string, newValue: string | null, oldValue: string | null) {
    this._cache.set(key, newValue)
    this.emit('change', key, newValue, oldValue)
  }

  protected set(key: string, value: string | null) {
    const cache = this._cache
    const oldValue = cache.has(key) ? cache.get(key)! : this.native.getItem(key)
    if (typeof value === 'string') {
      call(setItem, this.native, key, value)
    } else {
      call(removeItem, this.native, key)
    }
    cache.set(key, value)
    this.emit('change', key, value, oldValue)
  }

  protected emit<K extends keyof ReactiveLocalStorageEventMap>(
    name: K,
    ...args: ReactiveLocalStorageEventMap[K] extends (...args: infer T) => any ? T : any[]
  ) {
    const set = this._events[name]
    if (set) {
      for (const fn of set.values()) {
        fn.apply(null, args)
      }
    }
  }

  protected inject(storage: Storage) {
    const me = this
    const cache = this._cache
    storage[$handlers] = {
      getItem(this: Storage, key: string) {
        const value = getItem.call(this, key)
        cache.set(key, value)
      },
      setItem(this: Storage, key: string, value: any) {
        call(set, this, key, String(value))
      },
      removeItem(this: Storage, key: string) {
        call(set, this, key, null)
      },
    }

    function set(this: Storage, key: string, newValue: string | null) {
      let oldValue: string | null = null
      let error: any
      let hasError = false
      try {
        oldValue = me.getItem(key)
      } catch (e) {
        hasError = true
        error = e
      }
      if (newValue === null) {
        removeItem.call(this, key)
      } else {
        setItem.call(this, key, newValue)
      }
      if (hasError) {
        // tslint:disable-next-line no-console
        console.error(error)
        return
      }
      try {
        cache.set(key, newValue)
        if (newValue !== oldValue) {
          me.feed(key, newValue, oldValue)
        }
      } catch (e) {
        // tslint:disable-next-line no-console
        console.error(e)
      }
    }
  }
}

export interface ReactiveLocalStorageEventMap {
  change(key: string, newValue: string | null, oldValue: string | null): any
}

export function listen(target: Window, cb: (this: Window, ev: WindowEventMap['storage']) => any) {
  if (target.addEventListener) {
    target.addEventListener('storage', cb, true)
  } else if (target.attachEvent) {
    target.attachEvent('storage', cb)
  } else {
    return false
  }
  return true
}

function call<T, U extends any[], R>(fn: (this: T, ...args: U) => R, me: T, ...args: U): R {
  return fn.apply(me, args)
}

inject()

function inject() {
  if (Storage.prototype[$injectMark]) {
    console.warn(`Storage has been injected, there might be multi versions of reactive-localstorage`)
    return
  }
  Object.defineProperties(Storage.prototype, {
    getItem: {
      configurable: true,
      enumerable: false,
      writable: true,
      value(this: Storage, key: string) {
        const handlers = this[$handlers]
        if (handlers && typeof handlers.getItem === 'function') {
          return handlers.getItem.call(this, key)
        }
        return getItem.call(this, key)
      },
    },
    setItem: {
      configurable: true,
      enumerable: false,
      writable: true,
      value(this: Storage, key: string, value: any) {
        const handlers = this[$handlers]
        if (handlers && typeof handlers.setItem === 'function') {
          return handlers.setItem.call(this, key, value)
        }
        return setItem.call(this, key, value)
      },
    },
    removeItem: {
      configurable: true,
      enumerable: false,
      writable: true,
      value(this: Storage, key: string) {
        const handlers = this[$handlers]
        if (handlers && typeof handlers.setItem === 'function') {
          return handlers.removeItem.call(this, key)
        }
        return removeItem.call(this, key)
      },
    }
  })
}
