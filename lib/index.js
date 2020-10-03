'use strict'

const EventEmitter = require('events').EventEmitter
const Connection = require('./connection')
const logger = require('winston')
const parser = require('./parser')
const crc = require('./crc')

// Add a transport as fall back when no parent logger has been initialized
// to prevent the error: "Attempt to write logs with no transports"
logger.add(new logger.transports.Console({
  level: 'none'
}))

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
        // Determine what has been updated.
        // Note: power.actualConsumed and power.actualProduced must always be
        // reported because they represent the actual readings
        if (!current[cat] ||
          current[cat][key] === undefined ||
          current[cat][key] !== telegram[cat][key] ||
          key === 'actualConsumed' ||
          key === 'actualProduced') {
          if (!updates[cat]) {
            updates[cat] = {}
          }

          if (!current[cat]) {
            current[cat] = {}
          }

          current[cat][key] = telegram[cat][key]

          // Add the key to the updates to be reported
          updates[cat][key] = telegram[cat][key]

          // The gas consumption must be updated when the timestamp changes because this
          // indicates a new reading has been performed
          if (cat === 'gas' && key === 'timestamp' && telegram.gas.totalConsumed !== undefined) {
            updates.gas.totalConsumed = telegram.gas.totalConsumed
          }
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

    this._ignoreCrc = options.disableCrcChecking || false

    // this._currentValues = { power: {}, gas: {} }
    this._currentValues = {}
    this._inProgress = false
  }

  connect () {
    var self = this
    var telegram = []

    self._connection.on('connected', () => {
      self.emit('connected')
    })

    self._connection.on('data', line => {
      let full
      let updates
      let calculatedCrc
      let reportedCrc

      // Add line to buffer
      telegram.push(line)

      // When last line has been received start processing
      if (line[0] === '!') {
        const result = line.match(/!([a-fA-F0-9]+)/)
        if (result !== null) {
          reportedCrc = parseInt(result[1], 16)
          calculatedCrc = crc(telegram)
        }

        // Only process telegram without crc or without a validated crc
        if (reportedCrc === calculatedCrc || !reportedCrc || self._ignoreCrc) {
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
        } else {
          if (reportedCrc) {
            logger.error(`Telegram is not processed because of corruption (${reportedCrc.toString(16)}/${calculatedCrc.toString(16)})`)
          }
        }

        telegram = []
      }
    })

    self._connection.on('disconnected', () => {
      self.emit('disconnected')
    })

    self._connection.connect()
  }
}
