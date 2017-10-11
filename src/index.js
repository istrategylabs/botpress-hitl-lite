import checkVersion from 'botpress-version-manager'
import DB from './db'
import _ from 'lodash'

let db = null
let config = null

const incomingMiddleware = (event, next) => {
  if (!db) { return next() }

  if (_.includes(['delivery', 'read'], event.type)) {
    return next()
  }

  return db.getUserSession(event)
  .then(session => {
    if (session.is_new_session) {
      event.bp.events.emit('hitl-lite.session', session)
    }

    if ((!!session.paused || config.paused) && _.includes(['text', 'message'], event.type)) {
      event.bp.logger.debug('[hitl-lite] Session paused, message swallowed:', event.text)
      // the session or bot is paused, swallow the message
    } else {
      next()
    }
  })
}

const outgoingMiddleware = (event, next) => {
  if (!db) { return next() }

  return db.getUserSession(event)
  .then(session => {
    if (session.is_new_session) {
      event.bp.events.emit('hitl-lite.session', session)
    }

    next()
  })
}

module.exports = {

  config: {
    sessionExpiry: { type: 'string', default: '3 days' },
    paused: { type: 'bool', default: false, env: 'BOTPRESS_HITL_PAUSED' }
  },

  init: async (bp, configurator) => {
    checkVersion(bp, __dirname)

    bp.middlewares.register({
      name: 'hitl-lite.captureInMessages',
      type: 'incoming',
      order: 2,
      handler: incomingMiddleware,
      module: 'botpress-hitl-lite',
      description: 'Captures incoming messages and if the session if paused, swallow the event.'
    })

    bp.middlewares.register({
      name: 'hitl-lite.captureOutMessages',
      type: 'outgoing',
      order: 50,
      handler: outgoingMiddleware,
      module: 'botpress-hitl-lite',
      description: 'Captures outgoing messages to show inside HITL.'
    })

    config = await configurator.loadAll()

    bp.db.get()
    .then(knex => (db = DB(knex)))
    .then(() => db.initialize())
  },

  ready: function (bp) {
    bp.hitlLite = {
      pause: (platform, userId) => {
        return db.setSessionPaused(true, platform, userId, 'code')
        .then(sessionId => {
          bp.events.emit('hitl-lite.session', { id: sessionId })
          bp.events.emit('hitl-lite.session.changed', { id: sessionId, paused: 1 })
        })
      },
      unpause: (platform, userId) => {
        return db.setSessionPaused(false, platform, userId, 'code')
        .then(sessionId => {
          bp.events.emit('hitl-lite.session', { id: sessionId })
          bp.events.emit('hitl-lite.session.changed', { id: sessionId, paused: 0 })
        })
      },
      isPaused: (platform, userId) => {
        return db.isSessionPaused(platform, userId)
      }
    }

    const router = bp.getRouter('botpress-hitl-lite')

    router.get('/sessions', (req, res) => {
      db.getAllSessions(req.query.onlyPaused === 'true')
      .then(sessions => res.send(sessions))
    })

    // TODO post /sessions/:id/typing

    router.post('/sessions/:sessionId/pause', (req, res) => {
      db.setSessionPaused(true, null, null, 'operator', req.params.sessionId)
      .then(sessionId => {
        bp.events.emit('hitl-lite.session', { id: sessionId })
        bp.events.emit('hitl-lite.session.changed', { id: sessionId, paused: 1 })
      })
      .then(res.sendStatus(200))
    })

    router.post('/sessions/:sessionId/unpause', (req, res) => {
      db.setSessionPaused(false, null, null, 'operator', req.params.sessionId)
      .then(sessionId => {
        bp.events.emit('hitl-lite.session', { id: sessionId })
        bp.events.emit('hitl-lite.session.changed', { id: sessionId, paused: 0 })
      })
      .then(res.sendStatus(200))
    })
  }
}
