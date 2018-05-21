import { createDownMessage, hydrate, isUpMessage } from '../utils/index'


export const createChromeRuntimeProxy = store => {
  const state = {
    tabIds: []
  }


  const addTab = tabId => {
    if (state.tabIds.includes(tabId)) return

    // Sure, mutate, why not
    state.tabIds.push(tabId)

    // Send the new tab its initial state
    const message = createDownMessage(hydrate(store.getState()))
    chrome.tabs.sendMessage(tabId, message)

    return proxy // for chaining
  }


  const getProxyState = () => state


  const onMessage = message => {
    if (!isUpMessage(message)) return

    // Forward the propagated action to this proxied store.
    store.dispatch(message.action)
  }


  const removeTab = tabId => {
    const index = state.tabIds.indexOf(tabId)

    if (index === -1) return

    // Sure, mutate, why not
    state.tabIds.splice(index, 1)

    return proxy // for chaining
  }


  // Set up downstream notification
  store.subscribe(newState => {
    const message = createDownMessage(hydrate(newState))

    // Notify downstream proxies of the new state
    state.tabIds.forEach(tabId => {
      chrome.tabs.sendMessage(tabId, message)
    })
  })


  // Start listening to messages from tabs
  chrome.runtime.onMessage.addListener(onMessage)


  const proxy = {
    ...store,
    addTab,
    getProxyState,
    removeTab
  }


  return proxy
}
