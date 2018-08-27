export const UP = 'UP'
export const DOWN = 'DOWN'
export const CONNECTION = 'ZEDUX_SYNC_CONNECTION'
export const PROXY_MESSAGE = 'ZEDUX_SYNC_PROXY_MESSAGE'

export const createConnectionId = () => ({ name: CONNECTION })

export const createDownMessage = action => ({
  $$typeof: PROXY_MESSAGE,
  direction: DOWN,
  action
})

export const createUpMessage = action => ({
  $$typeof: PROXY_MESSAGE,
  direction: UP,
  action
})

export const hydrate = payload => ({
  type: '@@zedux/hydrate',
  payload
})

export const isConnection = ({ name }) => name === CONNECTION

export const isUpMessage = message =>
  isProxyMessage(message) && message.direction === UP

export const isDownMessage = message =>
  isProxyMessage(message) && message.direction === DOWN

export const isProxyMessage = ({ $$typeof }) => $$typeof === PROXY_MESSAGE

export const setState = payload => ({
  type: '@@zedux/partialHydrate',
  payload
})
