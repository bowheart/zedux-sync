import { createStore } from 'zedux'
import { createContext } from 'react-zedux'
import { createIframeProxy } from 'zedux-sync'


export const store = createStore()
  .hydrate({
    messages: []
  })


export const proxy = createIframeProxy(store)


export const context = createContext(proxy)
