import React from 'react'
import {
  Grid,
  Row,
  Col
} from 'react-bootstrap'

import Sidebar from './sidebar'
import Conversation from './conversation'
import Typing from './typing'

import style from './style.scss'

import _ from 'lodash'

const api = route => '/api/botpress-hitl-lite/' + route

export default class HitlModule extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      currentSession: null,
      sessions: null,
      onlyPaused: false
    }

    this.updateSession = ::this.updateSession
    this.refreshSessions = ::this.refreshSessions
  }

  componentDidMount() {
    this.props.bp.events.on('hitl-lite.session', this.refreshSessions)
    this.props.bp.events.on('hitl-lite.session.changed', this.updateSession)
    this.refreshSessions()
  }

  componentWillUnmount() {
    this.props.bp.events.off('hitl-lite.session', this.refreshSessions)
    this.props.bp.events.off('hitl-lite.session.changed', this.updateSession)
  }

  refreshSessions(session) {
    this.fetchAllSessions()
    .then(() => {
      if (!this.state.currentSession) {
        const firstSession = _.head(this.state.sessions.sessions)
        this.setSession(firstSession.id)
      }
    })
  }

  updateSession(changes) {
    if (!this.state.sessions) {
      return
    }

    const sessions = this.state.sessions.sessions.map(session => {
      return Object.assign({}, session, session.id === changes.id ? changes : {})
    })

    this.setState({ sessions: {
      total: this.state.sessions.total,
      sessions: sessions
    }})

    if (this.state.currentSession) {
      this.setSession(this.state.currentSession.id)
    }
  }

  getAxios() {
    return this.props.bp.axios
  }

  fetchAllSessions() {
    return this.getAxios().get('/api/botpress-hitl-lite/sessions?onlyPaused=' + this.state.onlyPaused)
    .then((res) => {
      this.setState({
        loading: false,
        sessions: res.data
      })
    })
  }

  toggleOnlyPaused() {
    this.setState({ onlyPaused: !this.state.onlyPaused, currentSession: null })
    setTimeout(() => {
      this.fetchAllSessions()
    }, 50)
  }

  setSession(sessionId) {
    const session = _.find(this.state.sessions.sessions, { id: sessionId })
    this.setState({ currentSession: session })
  }

  renderLoading() {
    return <h1>Loading...</h1>
  }

  render() {

    if (this.state.loading) {
      return this.renderLoading()
    }

    const currentSessionId = this.state.currentSession && this.state.currentSession.id
    return (
      <div className={style.mainContainer}>
        <Grid>
          <Row>
            <Col sm={3} className={style.column} lgOffset={1}>
              <Sidebar
                sessions={this.state.sessions}
                setSession={::this.setSession}
                currentSession={currentSessionId}
                filter={this.state.onlyPaused}
                toggleOnlyPaused={::this.toggleOnlyPaused} />
            </Col>
            <Col sm={9} className={style.column} lg={7}>
              <Row>
                <Col sm={12}>
                  <Conversation bp={this.props.bp} data={this.state.currentSession}/>
                </Col>
              </Row>
              <Row>
                <Col sm={12}>
                </Col>
              </Row>
            </Col>
          </Row>
        </Grid>
      </div>
    )
  }
}
