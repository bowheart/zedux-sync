import {
  createUpMessage,
  createDownMessage,
  hydrate as hydrateActor,
  isUpMessage,
  isDownMessage,
  setState as setStateActor
} from '../utils/index'


export const createIframeProxy = store => {
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
      throw new TypeError('Zedux Sync - Invalid object dispatched to child store. Proxy stores only accept plain object actions. The "type" property is also required.')
    }

    const message = createUpMessage(action)

    console.log('sending message to parent:', message, window)

    // Pass the action up to the parent window
    window.postMessage(message, '*') // TODO: origin permissions
  }


  const getProxyState = () => state


  const hydrate = newState => {
    const message = createUpMessage(hydrateActor(newState))

    // Pass the action up to the parent window
    window.postMessage(message, '*') // TODO: origin permissions
  }


  const onChildMessage = ({ data: message }) => {
    if (!isUpMessage(message)) return

    // Forward the action up to the parent window
    window.postMessage(message, '*') // TODO: origin permissions
  }


  const onParentMessage = ({ data: message }) => {
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
    window.postMessage(message, '*') // TODO: origin permissions
  }


  // Set up downstream notification
  store.subscribe(newState => {
    const message = createDownMessage(hydrateActor(newState))

    // Notify downstream proxies of the new state
    state.iframes.forEach(iframe => {
      iframe.contentWindow.postMessage(message, '*')
    })
  })


  // Start listening to messages from the parent window
  window.addEventListener('message', onParentMessage)


  const proxy = {
    ...store,
    addIframe,
    dispatch,
    hydrate,
    getProxyState,
    removeIframe,
    setState
  }


  return proxy
}
