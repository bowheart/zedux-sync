import {
  createUpMessage,
  createDownMessage,
  hydrate as hydrateActor,
  isUpMessage,
  isDownMessage,
  setState as setStateActor
} from '../utils/index'


export const createChromeTabProxy = store => {
  const state = {
    iframes: []
  }


  const addIframe = iframe => {
    if (state.iframes.includes(iframe)) return

    iframe.contentWindow.addEventListener('message', onChildMessage)

    // Sure, mutate, why not
    state.iframes.push(iframe)

    // Send the new iframe its initial state
    iframe.onload = () => {
      const message = createDownMessage(hydrateActor(store.getState()))

      iframe.contentWindow.postMessage(message, '*') // TODO: origin permissions
    }

    return proxy // for chaining
  }


  const dispatch = action => {
    if (typeof action !== 'object' || !action || !action.type) {
      throw new TypeError('Zedux Sync - Invalid object dispatched to child store. Proxy stores only accept plain object actions. The "type" property is required.')
    }

    const message = createUpMessage(action)

    // Pass the action up to the background process
    chrome.runtime.sendMessage(message)
  }


  const getProxyState = () => state


  const hydrate = newState => {
    const message = createUpMessage(hydrateActor(newState))

    // Pass the action up to the parent window
    window.postMessage(message, '*') // TODO: Figure out origin permissions
  }


  const onChildMessage = ({ data: message }) => {
    if (!isUpMessage(message)) return

    // Forward the proxy message on to the background
    chrome.runtime.sendMessage(message)
  }


  const onParentMessage = message => {
    if (!isDownMessage(message)) return

    store.dispatch(message.action)
  }


  const removeIframe = iframe => {
    const index = state.iframes.indexOf(iframe)

    if (index === -1) return

    iframe.contentWindow.removeEventListener('message', onChildMessage)

    // Sure, mutate, why not
    state.iframes.splice(index, 1)

    return proxy // for chaining
  }


  const setState = partialStateUpdate => {
    const message = createUpMessage(setStateActor(newState))

    // Pass the action up to the parent window
    window.postMessage(message, '*') // TODO: Figure out origin permissions
  }


  // Set up downstream notification
  store.subscribe(newState => {
    const message = createDownMessage(hydrateActor(newState))

    // Notify downstream proxies of the new state
    state.iframes.forEach(iframe => {
      iframe.contentWindow.postMessage(message, '*') // TODO: origin permissions
    })
  })


  // Start listening to messages from the runtime
  chrome.runtime.onMessage.addListener(onParentMessage)

  // Start listening to messages from children
  window.addEventListener('message', onChildMessage)


  const proxy = {
    ...store,
    addIframe,
    dispatch,
    getProxyState,
    hydrate,
    removeIframe,
    setState
  }


  return proxy
}
