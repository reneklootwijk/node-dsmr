'use strict'

const EventEmitter = require('events').EventEmitter
const Connection = require('./connection')
const logger = require('winston')
const parser = require('./parser')

function findUpdates (current, telegram) {
  var updates = {}

  for (const cat in telegram) {
    if (typeof telegram[cat] !== 'object') {
      if (!current[cat] || current[cat] !== telegram[cat]) {
        updates[cat] = telegram[cat]

        current[cat] = telegram[cat]
      }
    } else {
      for (const key in telegram[cat]) {
        if (!current[cat] || current[cat][key] === undefined || current[cat][key] !== telegram[cat][key]) {
          if (!updates[cat]) {
            updates[cat] = {}
          }

          if (!current[cat]) {
            current[cat] = {}
          }

          updates[cat][key] = telegram[cat][key]

          current[cat][key] = telegram[cat][key]
        }
      }
    }
  }

  return updates
}

module.exports = class SmartMeter extends EventEmitter {
  constructor (options = {}) {
    super()

    this._connection = new Connection(options)

    // this._currentValues = { power: {}, gas: {} }
    this._currentValues = {}
  }

  connect () {
    var self = this
    var telegram = []

    self._connection.on('connected', () => {
      self.emit('connected')
    })

    self._connection.on('data', line => {
      var full
      var updates

      // When last line has been received start processing
      if (line[0] === '!') {
        full = parser(telegram)

        if (full) {
          logger.debug(`SmartMeter: Telegram ${JSON.stringify(full)}`)
          self.emit('telegram', full)

          updates = findUpdates(self._currentValues, full)

          // Emit the updated properties of the telegram only
          if (Object.keys(updates).length) {
            logger.debug(`SmartMeter: Updates ${JSON.stringify(updates)}`)
            self.emit('update', updates)
          }
        }

        telegram = []
      } else {
        // Add line to buffer
        telegram.push(line)
      }
    })

    self._connection.on('disconnected', () => {
      self.emit('disconnected')
    })

    self._connection.connect()
  }

  disconnect () {
    var self = this

    self._connection.disconnect()
  }
}
