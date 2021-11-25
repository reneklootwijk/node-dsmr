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

  for (const key in telegram.power) {
    // Determine what has been updated.
    // Note: power.actualConsumed and power.actualProduced must always be
    //       reported because they represent the actual readings
    if (
      current.power[key] === undefined ||
      current.power[key] !== telegram.power[key] ||
      key === 'actualConsumed' ||
      key === 'actualProduced') {
      if (!updates.power) {
        updates.power = {}
      }

      current.power[key] = telegram.power[key]

      // Add the key to the updates to be reported
      updates.power[key] = telegram.power[key]
    }
  }

  // The gas consumption must only be updated when the timestamp changes because this
  // indicates a new reading has been performed
  if (!current.gas.timestamp || telegram.gas.timestamp > current.gas.timestamp) {
    updates.gas = {}

    // Note: gas.consumedLastPeriod must always be reported because it represents the actual consumption
    //       in the last period
    if (current.gas.totalConsumed) {
      updates.gas.reportedPeriod = telegram.gas.reportedPeriod
      updates.gas.consumedLastPeriod = Math.round((telegram.gas.totalConsumed - current.gas.totalConsumed) * 1000) / 1000
    }

    if (!current.gas.totalConsumed || current.gas.totalConsumed < telegram.gas.totalConsumed) {
      updates.gas.totalConsumed = telegram.gas.totalConsumed
      current.gas.totalConsumed = telegram.gas.totalConsumed
    }

    if (!current.gas.valvePosition || current.gas.valvePosition !== telegram.gas.valvePosition) {
      updates.gas.valvePosition = telegram.gas.valvePosition
      current.gas.valvePosition = telegram.gas.valvePosition
    }

    // Update the last reported timestamp
    current.gas.timestamp = telegram.gas.timestamp
    updates.gas.timestamp = telegram.gas.timestamp
  }

  return updates
}

module.exports = class SmartMeter extends EventEmitter {
  constructor (options = {}) {
    super()

    this._connection = new Connection(options)

    this._ignoreCrc = options.disableCrcChecking || false

    this._currentValues = { power: {}, gas: {} }
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
              // updates.dsmrVersion = full.dsmrVersion
              // updates.timestamp = full.timestamp
              // updates.meterModel = full.meterModel

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
