import React, { Component } from 'react'

import { addMessage } from '../common'
import { context } from './store'


class App extends Component {
  constructor(props) {
    super(props)

    this.dispatch = this.dispatch.bind(this)
    this.setIframe = this.setIframe.bind(this)
  }

  dispatch() {
    this.props.proxy.dispatch(addMessage('from parent'))
  }

  setIframe(el) {
    if (!el) return

    this.props.proxy.addIframe(el)
  }

  render() {
    return (
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          the parent
          <div>
            <button onClick={this.dispatch}>dispatch action</button>
          </div>
          Messages:
          <pre>{JSON.stringify(this.props.proxy.state.messages, null, 2)}</pre>
        </div>
        <iframe
          ref={this.setIframe}
          src="/nested-iframes/child/index.html"
          style={{
            border: 'none',
            flex: 2,
            height: '100vh'
          }}
        />
      </div>
    )
  }
}


export default context.inject('proxy')(App)
