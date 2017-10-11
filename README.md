# botpress-hitl-lite

Lite HITL (Human In The Loop) module for Botpress. This module has been built to easily pause and unpause your bot's conversation when it's needed. By using this module, you can stop automatic responses of your bot. This is *not* the official HITL module for Botpress. Functionality is limited to pausing and unpausing your bot's conversation.

**Support connectors: ** [botpress-messenger](https://github.com/botpress/botpress-messenger)

### Filtering by status

You can filter conversations based on their status (paused/active) by using filtering button in the UI.

### Pausing/resuming conversations

You can pause or resume any conversations from the UI.

## API

### `POST /api/botpress-hitl-lite/sessions/{$id}/pause`

Pause a specific conversation by using his `id`.

### `POST /api/botpress-hitl-lite/sessions/{$id}/unpause`

Resume a conversation for a specific user.

## Example

A basic implementation example that shows how easy it is to implement a help request in Messenger.

```js
  const _ = require('lodash')

  module.exports = function(bp) {
    bp.middlewares.load()

    bp.hear(/HITL_START/, (event, next) => {
      bp.messenger.sendTemplate(event.user.id, {
        template_type: 'button',
        text: 'Bot paused, a human will get in touch very soon.',
        buttons: [{
          type: 'postback',
          title: 'Cancel request',
          payload: 'HITL_STOP'
        }]
      })

      bp.notifications.send({
        message: event.user.first_name + ' wants to talk to a human',
        level: 'info',
        url: '/modules/botpress-hitl-lite'
      })
      bp.hitl-lite.pause(event.platform, event.user.id)
    })

    bp.hear(/HITL_STOP/, (event, next) => {
      bp.messenger.sendText(event.user.id, 'Human in the loop disabled. Bot resumed.')
      bp.hitl-lite.unpause(event.platform, event.user.id)
    })

    bp.hear({ type: 'message', text: /.+/i }, (event, next) => {
      bp.messenger.sendText(event.user.id, 'You said: ' + event.text)
    })
  }
```

**Note**: This is the only code you need to add to your bot in your `index.js` file.

## License

botpress-hitl-lite is licensed under AGPLv3.
