import { LocalStorage } from './localstorage'

const ENV = typeof window !== 'undefined' ? window : (
  typeof global !== 'undefined' ? global : undefined
) as Window | undefined

const localstorage = new LocalStorage(ENV)

if (process.env.NODE_ENV !== 'production') {
  if (!localstorage.supported) {
    console.warn(`You environment doesn't support localStorage`)
  }
}

export * from './localstorage'
export * from './env'

export default localstorage
