export class LocalStorage implements Storage {
  readonly supported: boolean
  readonly native: Storage

  protected _events: {
    [P in keyof ReactiveLocalStorageEventMap]?: Set<ReactiveLocalStorageEventMap[P]>
  } = {}
  protected _cache: Map<string, string | null>
  protected _length = 0
  protected _injected = false

  constructor(window?: Window, storage?: Storage) {
    if (window) {
      this.supported = true
    } else {
      this.supported = false
      window = new Window()
    }
    this.native = storage || window.localStorage
    this._cache = new Map()
    this.inject(window, this.native)
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
    const value = this.native.getItem(key)
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
      this.native.setItem(key, value)
    } else {
      this.native.removeItem(key)
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

  protected inject(target: Window, storage: Storage) {
    const me = this
    const cache = this._cache
    const injected = Object.create(storage)
    Object.defineProperties(injected, {
      getItem: {
        configurable: true,
        enumerable: false,
        writable: true,
        value(this: Storage, key: string) {
          const value = storage.getItem(key)
          cache.set(key, value)
        },
      },
      setItem: {
        configurable: true,
        enumerable: false,
        writable: true,
        value(this: Storage, key: string, value: any) {
          set(key, String(value))
        },
      },
      removeItem: {
        configurable: true,
        enumerable: false,
        writable: true,
        value(this: Storage, key: string) {
          set(key, null)
        },
      }
    })

    Object.defineProperty(target, 'localStorage', {
      ...Object.getOwnPropertyDescriptor(window, 'localStorage'),
      get: () => injected,
    })

    this._injected = true

    function set(key: string, newValue: string | null) {
      let oldValue: string | null
      let error: any
      let hasError = false
      try {
        oldValue = me.getItem(key)
      } catch (e) {
        hasError = true
        error = e
      }
      if (newValue === null) {
        storage.removeItem(key)
      } else {
        storage.setItem(key, newValue)
      }
      if (hasError) {
        // tslint:disable-next-line no-console
        console.error(error)
        return
      }
      try {
        cache.set(key, newValue)
        me.feed(key, newValue, oldValue!)
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
