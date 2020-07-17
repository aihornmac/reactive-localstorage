import { LocalStorage } from './localstorage'

const ENV = typeof window !== 'undefined' ? window : (
  typeof global !== 'undefined' ? global : undefined
) as Window | undefined

const ls = new LocalStorage(ENV, localStorage)
const ss = new LocalStorage(ENV, sessionStorage)

if (process.env.NODE_ENV !== 'production') {
  if (!ls.supported) {
    console.warn(`You environment doesn't support LocalStorage`)
  }
  if (!ss.supported) {
    console.warn(`You environment doesn't support SessionStorage`)
  }
}

export * from './localstorage'
export * from './env'

export {
  ls as localStorage,
  ss as sessionStorage,
}

export default ls
