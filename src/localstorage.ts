export class LocalStorage implements Storage {
  readonly supported: boolean

  protected storage: Storage
  protected _events: {
    [P in keyof ReactiveLocalStorageEventMap]?: Set<ReactiveLocalStorageEventMap[P]>
  } = {}

  constructor(window?: Window, storage?: Storage) {
    if (window) {
      this.supported = true
    } else {
      this.supported = false
      window = new Window()
    }
    this.storage = storage || window.localStorage
    listen(window, ({ key, newValue }) => {
      if (!key) return
      this.feed(key, newValue)
    })
  }

  get length() {
    return this.storage.length
  }

  key(index: number) {
    return this.storage.key(index)
  }

  getItem(key: string) {
    return this.storage.getItem(key)
  }

  setItem(key: string, value: string) {
    this.storage.setItem(key, value)
    this.emit('change', key, value)
  }

  removeItem(key: string) {
    this.storage.removeItem(key)
    this.emit('change', key, null)
  }

  clear() {
    this.storage.clear()
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

  feed(key: string, newValue: string | null) {
    this.emit('change', key, newValue)
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
}

export interface ReactiveLocalStorageEventMap {
  change(key: string, newValue: string | null): any
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
