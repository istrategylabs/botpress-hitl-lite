import { DatabaseHelpers as helpers } from 'botpress'

var knex = null

function initialize () {
  if (!knex) {
    throw new Error('you must initialize the database before')
  }

  return helpers(knex).createTableIfNotExists('hitl-lite_sessions', function (table) {
    table.increments('id').primary()
    table.string('platform')
    table.string('userId')
    table.string('full_name')
    table.string('user_image_url')
    table.timestamp('last_event_on')
    table.timestamp('last_heard_on')
    table.boolean('paused')
    table.string('paused_trigger')
  })
}

function createUserSession (event) {
  let profileUrl = null
  let fullName = '#' + Math.random().toString().substr(2)

  if (event.user && event.user.first_name && event.user.last_name) {
    profileUrl = event.user.profile_pic || event.user.picture_url
    fullName = event.user.first_name + ' ' + event.user.last_name
  }

  const session = {
    platform: event.platform,
    userId: event.user.id,
    user_image_url: profileUrl,
    last_event_on: helpers(knex).date.now(),
    last_heard_on: helpers(knex).date.now(),
    paused: 0,
    full_name: fullName,
    paused_trigger: null
  }

  return knex('hitl-lite_sessions')
  .insert(session)
  .then(results => {
    session.id = results[0]
    session.is_new_session = true
  })
  .then(() => knex('hitl-lite_sessions').where({ id: session.id }).then().get(0))
  .then(dbSession => Object.assign({}, session, dbSession))
}

function getUserSession (event) {
  const userId = (event.user && event.user.id) || event.raw.to
  return knex('hitl-lite_sessions')
  .where({ platform: event.platform, userId: userId })
  .select('*')
  .limit(1)
  .then(users => {
    if (!users || users.length === 0) {
      return createUserSession(event)
    } else {
      return users[0]
    }
  })
}

function getSession (sessionId) {
  return knex('hitl-lite_sessions')
  .where({ id: sessionId })
  .select('*')
  .limit(1)
  .then(users => {
    if (!users || users.length === 0) {
      return null
    } else {
      return users[0]
    }
  })
}

function setSessionPaused (paused, platform, userId, trigger, sessionId = null) {
  if (sessionId) {
    return knex('hitl-lite_sessions')
    .where({ id: sessionId })
    .update({ paused: paused ? 1 : 0, paused_trigger: trigger })
    .then(() => parseInt(sessionId))
  } else {
    return knex('hitl-lite_sessions')
    .where({ userId, platform })
    .update({ paused: paused ? 1 : 0, paused_trigger: trigger })
    .then(() => {
      return knex('hitl-lite_sessions')
      .where({ userId, platform })
      .select('id')
    })
    .then(sessions => parseInt(sessions[0].id))
  }
}

function isSessionPaused (platform, userId, sessionId = null) {
  const toBool = s => helpers(knex).bool.parse(s)

  if (sessionId) {
    return knex('hitl-lite_sessions')
    .where({ id: sessionId })
    .select('paused').then().get(0).then(s => s && toBool(s.paused))
  } else {
    return knex('hitl-lite_sessions')
    .where({ userId, platform })
    .select('paused').then().get(0).then(s => s && toBool(s.paused))
  }
}

function getAllSessions (onlyPaused) {
  let condition = ''

  if (onlyPaused === true) {
    condition = 'paused = ' + helpers(knex).bool.true()
  }

  return knex.select('*')
  .from('hitl-lite_sessions')
  .whereRaw(condition)
  .orderBy('last_event_on', 'desc')
  .limit(100)
  .then(results => ({
    total: 0,
    sessions: results
  }))
}

module.exports = k => {
  knex = k

  return {
    initialize,
    getUserSession,
    setSessionPaused,
    getAllSessions,
    getSession,
    isSessionPaused
  }
}
