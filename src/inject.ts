import { LocalStorage } from './localstorage'
import localstorage from '.'

declare global {
  interface Window {
    localStorage: LocalStorage
  }
}

Object.defineProperty(window, 'localStorage', {
  ...Object.getOwnPropertyDescriptor(window, 'localStorage'),
  get: () => localstorage,
})
