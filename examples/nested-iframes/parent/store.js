import { createStore, react } from 'zedux'
import { createContext } from 'react-zedux'
import { createDomProxy } from 'zedux-sync'

import { addMessage } from '../common'


export const store = createStore({
  messages: react([]).to(addMessage).withReducers((state, { payload }) => [
    ...state,
    payload
  ])
})


export const proxy = createDomProxy(store)


export const context = createContext(proxy)
