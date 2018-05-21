import React, { Component } from 'react'

import { addMessage } from '../common'
import { context } from './store'


class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      messages: []
    }

    this.dispatch = this.dispatch.bind(this)
  }

  dispatch() {
    this.props.proxy.dispatch(addMessage('from grandchild'))
  }

  render() {
    return (
      <div>
        the grandchild.
        <div>
          <button onClick={this.dispatch}>dispatch action</button>
        </div>
        Messages:
        <pre>{JSON.stringify(this.props.proxy.state.messages, null, 2)}</pre>
      </div>
    )
  }
}


export default context.inject('proxy')(App)
