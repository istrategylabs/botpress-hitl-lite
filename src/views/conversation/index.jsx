import React from 'react'
import {
  Tooltip,
  OverlayTrigger
} from 'react-bootstrap'
import Toggle from 'react-toggle'
import classnames from 'classnames'

import 'react-toggle/style.css'
import style from './style.scss'

import Message from '../message'

export default class Conversation extends React.Component {
  constructor() {
    super()

    this.state = { loading: true, messages: null }
  }

  scrollToBottom() {
    const messageScrollDiv = this.refs.innerMessages
    if (messageScrollDiv) {
      messageScrollDiv.scrollTop = messageScrollDiv.scrollHeight
    }
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  togglePaused() {
    this.props.data.props = !this.props.data.props
    const sessionId = this.props.data.id
    const action = !!this.props.data.paused ? 'unpause' : 'pause'
    this.getAxios().post(`/api/botpress-hitl-lite/sessions/${sessionId}/${action}`)
  }

  getAxios() {
    return this.props.bp.axios
  }

  componentWillReceiveProps(nextProps) {
    let newData = this.props.data
    if (nextProps.data) {
      newData = nextProps.data
    }
  }

  renderHeader() {
    const pausedTooltip = <Tooltip id="pausedTooltip">Pause this conversation</Tooltip>

    return (
      <div>
        <h3>
          {this.props.data && this.props.data.full_name}
          {this.props.data && !!this.props.data.paused
            ? <span className={style.pausedWarning}>Paused</span>
            : null}
        </h3>
        <OverlayTrigger placement="left" overlay={pausedTooltip}>
          <div className={style.toggleDiv}>
            <Toggle className={classnames(style.toggle, style.enabled)}
              checked={this.props.data && !this.props.data.paused}
              onChange={::this.togglePaused}/>
          </div>
        </OverlayTrigger>
      </div>
    )
  }


  render() {
    const dynamicHeightStyleMessageDiv = {
      height: innerHeight - 210
    }

    return (
      <div className={style.conversation}>
        <div className={style.header}>
          {this.props.data ? ::this.renderHeader() : null}
        </div>
      </div>
    )
  }
}
