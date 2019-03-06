import { version } from './env'

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
    // istanbul ignore next
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

  get version() {
    return version
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
    const value = getItem.call(this.native, key)
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
    if (newValue !== oldValue) {
      try {
        this.emit('change', key, newValue, oldValue)
      } catch (e) {
        // tslint:disable-next-line no-console
        console.error(e)
      }
    }
  }

  protected set(key: string, value: string | null) {
    const cache = this._cache
    const oldValue = cache.has(key) ? cache.get(key)! : this.native.getItem(key)
    if (typeof value === 'string') {
      setItem.call(this.native, key, value)
    } else {
      removeItem.call(this.native, key)
    }
    cache.set(key, value)
    this.emit('change', key, value, oldValue)
  }

  protected emit<K extends keyof ReactiveLocalStorageEventMap>(
    name: K,
    ...args: ArgumentsType<ReactiveLocalStorageEventMap[K]>
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
    const handlers = storage[$handlers] || (storage[$handlers] = [])
    handlers.push({
      injector: this,
      getItem(this, key) {
        const value = getItem.call(this, key)
        cache.set(key, value)
      },
      setItem(this, key, value) {
        set.call(this, key, String(value))
      },
      removeItem(this, key) {
        set.call(this, key, null)
      },
    })

    function set(this: Storage, key: string, newValue: string | null) {
      const oldValue = me.getItem(key)
      if (newValue === null) {
        removeItem.call(this, key)
      } else {
        setItem.call(this, key, newValue)
      }
      me.feed(key, newValue, oldValue)
    }
  }
}

export interface ReactiveLocalStorageEventMap {
  change(key: string, newValue: string | null, oldValue: string | null): void
}

function listen(target: Window, cb: (this: Window, ev: WindowEventMap['storage']) => any) {
  if (target.addEventListener) {
    target.addEventListener('storage', cb, true)
    // istanbul ignore next
  } else if (target.attachEvent) {
    target.attachEvent('storage', cb)
    // istanbul ignore next
  } else {
    return false
  }
  return true
}

inject()

function inject() {
  // istanbul ignore next
  if (Storage.prototype[$injectMark]) {
    console.warn(`Storage has been injected, there might be multi versions of reactive-localstorage`)
    return
  }
  Object.defineProperties(Storage.prototype, {
    [$injectMark]: {
      configurable: true,
      enumerable: false,
      writable: true,
      value: true,
    },
    [$handlers]: {
      configurable: true,
      enumerable: false,
      writable: true,
      value: [],
    },
    getItem: {
      configurable: true,
      enumerable: false,
      writable: true,
      value(this: Storage, key: string) {
        const handlers = this[$handlers]
        if (handlers) {
          for (const { getItem: fn } of handlers) {
            if (typeof fn === 'function') {
              fn.call(this, key)
            }
          }
        }
        return getItem.call(this, key)
      },
    },
    setItem: {
      configurable: true,
      enumerable: false,
      writable: true,
      value(this: Storage, key: string, value: string) {
        const handlers = this[$handlers]
        if (handlers) {
          for (const { setItem: fn } of handlers) {
            if (typeof fn === 'function') {
              fn.call(this, key, value)
            }
          }
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
        if (handlers) {
          for (const { removeItem: fn } of handlers) {
            if (typeof fn === 'function') {
              fn.call(this, key)
            }
          }
        }
        return removeItem.call(this, key)
      },
    }
  })
}

interface Handler {
  injector: LocalStorage
  getItem?(this: Storage, key: string): void
  setItem?(this: Storage, key: string, value: unknown): void
  removeItem?(this: Storage, key: string): void
}

declare var Storage: {
  prototype: Storage
  new(): Storage
}

interface Storage {
  [$injectMark]?: boolean
  [$handlers]?: Handler[]
  /**
   * Returns the number of key/value pairs currently present in the list associated with the
   * object.
   */
  readonly length: number
  /**
   * Empties the list associated with the object of all key/value pairs, if there are any.
   */
  clear(): void
  /**
   * value = storage[key]
   */
  getItem(key: string): string | null
  /**
   * Returns the name of the nth key in the list, or null if n is greater
   * than or equal to the number of key/value pairs in the object.
   */
  key(index: number): string | null
  /**
   * delete storage[key]
   */
  removeItem(key: string): void
  /**
   * storage[key] = value
   */
  setItem(key: string, value: string): void
}

type ArgumentsType<T> = T extends (...args: infer A) => any ? A : []
