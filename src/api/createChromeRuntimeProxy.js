import {
  createDownMessage,
  hydrate,
  isConnection,
  isUpMessage
} from '../utils/index'

export const createChromeRuntimeProxy = store => {
  const state = {
    ports: []
  }

  const onConnect = port => {
    if (!isConnection(port)) return

    port.onMessage.addListener(onMessage)
    port.onDisconnect.addListener(port => {
      state.ports.splice(state.ports.indexOf(port), 1)
    })

    // Sure, mutate, why not
    state.ports.push(port)

    // Send the new tab its initial state
    const message = createDownMessage(hydrate(store.getState()))
    port.postMessage(message)

    return proxy // for chaining
  }

  const getProxyState = () => state

  const onMessage = message => {
    if (!isUpMessage(message)) return

    // Forward the propagated action to this proxied store.
    store.dispatch(message.action)
  }

  // Set up downstream notification
  store.subscribe(newState => {
    const message = createDownMessage(hydrate(newState))

    // Notify downstream proxies of the new state
    state.ports.forEach(port => {
      port.postMessage(message)
    })
  })

  // Start listening to messages from tabs
  chrome.runtime.onConnect.addListener(onConnect)

  const proxy = {
    ...store,
    getProxyState
  }

  return proxy
}
