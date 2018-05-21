import { createDownMessage, hydrate, isUpMessage } from '../utils/index'


export const createDomProxy = store => {
  const state = {
    iframes: []
  }


  const addIframe = iframe => {
    if (state.iframes.includes(iframe)) return

    iframe.contentWindow.addEventListener('message', onMessage)

    // Sure, mutate, why not
    state.iframes.push(iframe)

    // Send the new iframe its initial state
    iframe.onload = () => {
      const message = createDownMessage(hydrate(store.getState()))

      iframe.contentWindow.postMessage(message, '*') // TODO: origin permissions
    }

    return proxy // for chaining
  }


  const getProxyState = () => state


  const onMessage = ({ data: message }) => {
    if (!isUpMessage(message)) return

    // Forward the propagated action to this proxied store.
    store.dispatch(message.action)
  }


  const removeIframe = iframe => {
    const index = state.iframes.indexOf(iframe)

    if (index === -1) return

    iframe.contentWindow.removeEventListener('message', onMessage)

    // Sure, mutate, why not
    state.iframes.splice(index, 1)

    return proxy // for chaining
  }


  // Set up downstream notification
  store.subscribe(newState => {
    const message = createDownMessage(hydrate(newState))

    // Notify downstream proxies of the new state
    state.iframes.forEach(iframe => {
      iframe.contentWindow.postMessage(message, '*') // TODO: origin permissions
    })
  })


  const proxy = {
    ...store,
    addIframe,
    getProxyState,
    removeIframe
  }


  return proxy
}
