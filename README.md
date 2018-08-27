# Zedux Sync

Reactively sync proxied stores across realms. Yeah.

> Note that this package is still under development.

## Installation

Install using npm:

```bash
npm install zedux-sync
```

Or yarn:

```bash
yarn add zedux-sync
```

Or include the appropriate unpkg build on your page (module exposed as `ZeduxSync`):

### Development

```html
<script src="https://unpkg.com/zedux-sync/dist/zedux-sync.js"></script>
```

### Production

```html
<script src="https://unpkg.com/zedux-sync/dist/zedux-sync.min.js"></script>
```

## Getting started

To learn by example, check out the [examples in the repo](https://github.com/bowheart/zedux-sync/tree/master/examples).

To learn from us, check out the [documentation](https://bowheart.github.io/zedux-sync/docs/overview).

To learn comprehensively, check out the [tests](https://github.com/bowheart/zedux-sync/tree/master/test).

Or keep reading for a brief run-down:

## What's a realm?

A realm is just an isolated execution context. The glowing example here is an iframe. An iframe is an isolated window environment that lives inside another window. Communication between these two realms is governed by a strict set of rules and thus can be a pain to work with.

Realms include workers, browser extensions, iframes, your server, virtual machines, and, of course, the [realms proposal](https://github.com/tc39/proposal-realms).

## How does Zedux Sync work?

Zedux Sync takes a couple tips from React.

### A single source of truth

Cross-realm applications often have state spattered here and there across the realms. With Zedux Sync, you instead create a single Zedux store in the highest realm to serve as the "single source of truth". Each inner realm then gets a "proxy" store whose state will be synchronized with the almighty source of truth.

Rather than manually wiring events in one realm to state updates in another (e.g. typical ajax call and response patterns), you just dispatch actions to the current realm's proxy. Zedux Sync manages shuttling the actions to the highest store where they will be dispatched normally. Zedux Sync then manages propagating the resulting state change across all registered proxies in all inner realms.

### React to state changes

Each realm can subscribe to its proxy store and reactively update UI when Zedux Sync updates the state. For apps built in React, React Zedux handles this subscription for you.

## Optimal state updates

Since communications between realms usually have to be serialized by the sender then deserialized by the receiver, it's important to make these communications as small as possible. `JSON.parse()` and `JSON.stringify()` are slow! Zedux Sync is able to find the "hot path" of each state update and sends the bare minimum data as a [partial hydrate action](https://bowheart.github.io/zedux/docs/api/actionTypes.html#partialhydrate) to the proxied stores of inner realms.

## Example Usage

Let's take a simple iframe example. Normally we'd have to do something like the following to manually wire up the communication between the iframe and the parent window:

```js
// in the parent window:
iframe.contentWindow.addEventListener('message', handleIframeMsg)
iframe.contentWindow.postMessage(message, '*')


// in the iframe:
window.addEventListener('message', handleParentMsg)
window.postMessage(message, '*')
```

This is the old-school event-based model. While simple it is not reactive. Data flows both ways. It does not encourage a single source of truth. This sort interwoven state management can quickly become dizzying. There is a better way.

Zedux Sync allows us to simply create a store in both the parent window and the iframe. The parent window's store will be the real single source of truth. The iframe's store will be a "proxy". All we have to do is hook them up to each other and Zedux Sync will keep them synchronized:

```js
// in the parent window:
import { createStore } from 'zedux'
import { createDomProxy } from 'zedux-sync'

const store = createStore()
const domProxy = createDomProxy(store)

// This is all we need to do to hook up the two stores.
// This assumes "iframe" is a loaded HTMLIFrameElement.
domProxy.addIframe(iframe)
domProxy.setState({ isAwesome: true })


// in the iframe:
import { createIframeProxy } from 'zedux-sync'

const store = createStore()
const iframeProxy = createIframeProxy(store)

iframeProxy.subscribe(newState => {
  console.log('the new state:', newState)

  // as soon as the iframe loads, this will log:
  // the new state: { isAwesome: true }
})
```

That's it! At this point, any action (or inducer or setState/hydrate call) dispatched to either store will get shuttled up to the reducer layer of the parent window's store. The parent window's store will calculate the new state and notify the attached iframe proxy of the state update:

```js
// in the parent window:
domProxy.subscribe(newState => {
  console.log('the new state:', newState)
})


// in the iframe:
iframeProxy.setState({ isSuperAwesome: true })
```

After running this, both the parent window and the iframe will log:

```
the new state: { isAwesome: true, isSuperAwesome: true }
```

## API

Currently, Zedux Sync only supports creating proxies in 4 different realms (plenty more to come!):

- `createChromeRuntimeProxy` - Realm: Chrome extension runtime
- `createChromeTabProxy` - Realm: Chrome extension tab
- `createDomProxy` - Realm: Any normal webpage (client-side)
- `createIframeProxy` - Realm: An iframe.

Chrome Runtime proxies and Dom proxies are meant to wrap top-level stores (the "single source of truth" stores). As such, they would never be used together. A reactive Zedux Sync flow for a chrome extension might look like:

```
              chromeRuntimeProxy
             /                  \
      chromeTabProxy       chromeTabProxy
     /              \
iframeProxy     iframeProxy
     |
iframeProxy
```

In this example, the Chrome Runtime proxy is the single source of truth and it can sync up with any number of Chrome Tab proxies which in turn can sync up with any number of iframe proxies. Iframe proxies can be nested indefinitely (just as iframes can be nested indefinitely).

Any action/inducer/etc dispatched to any store anywhere in this tree will be relayed up to the Chrome Runtime store. There the state update will be calculated and propagated down the entire tree. :O

More documentation and concrete examples to come on these functions. For now, the only important thing to note is that iframes must be manually added to a parent proxy. Chrome Tab proxies, Dom proxies, and iframe proxies all have two methods:

#### `addIframe`

Add an iframe to the proxy. Any iframe proxies in the iframe will begin receiving state updates from and relaying messages up to this proxy automatically. Example:

```js
import { createStore } from 'zedux'
import { createTabProxy } from 'zedux-sync'

const store = createStore()
const proxy = createTabProxy(store)

proxy.addIframe(document.querySelector('iframe'))
```

#### `removeIframe`

Remove the given iframe from the proxy. Any iframe proxies in the iframe will no longer receive state updates from this proxy. Example:

```js
domProxy.removeIframe(document.querySelector('iframe'))
```

## What if my page won't always be loaded in an iframe?

Zedux Sync will detect if an iframe proxy is created outside an iframe. When this happens, the iframe proxy will simply dispatch all received actions/inducers/whatever directly to the wrapped store rather than attempting to shuttle them up to the non-existent parent window's store.