'use strict'

const EventEmitter = require('events').EventEmitter
const logger = require('winston')
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

// Add a transport as fall back when no parent logger has been initialized
// to prevent the error: "Attempt to write logs with no transports"
logger.add(new logger.transports.Console({
  level: 'none'
}))

module.exports = class Connection extends EventEmitter {
  constructor (options = {}) {
    // Call constructor of the EventEmitter class
    super()

    if (!options.port) {
      throw new Error('Cannot create serial connection, no port specified')
    }

    this._port = options.port
    this._baudrate = options.baudrate || 9600
    this._parity = options.parity || 'none'
    this._databits = options.databits || 8
    this._serialParser = options.serialParser

    this._connection = null
    this._connected = false
  }

  connect () {
    var self = this
    var parser

    logger.debug('Connection.connect: Entering')

    if (!self._connection) {
      self._connection = new SerialPort(self._port, {
        baudRate: self._baudrate,
        dataBits: self._databits,
        parity: self._parity,
        autoOpen: false
      })

      parser = self._connection.pipe(new Readline())
    }

    // Handler for open event serial port
    self._connection.on('open', function () {
      logger.debug('Connected using serial connection')

      // Set connection flag
      self._connected = true

      // Emit connected event
      self.emit('connected')
    })

    parser.on('data', function (data) {
      self.emit('data', data)
    })

    self._connection.on('error', function (err) {
      logger.error(`Connection._connect: ${err.message}`)
    })

    // Handler for connection end
    self._connection.on('close', function () {
      // Reset connection flag
      self._connected = false

      // Emit disconnected event
      self.emit('disconnected')

      logger.error('Connection: Closed')

      // Reconnect logic
      setTimeout(function () {
        logger.debug('Connection: Reconnecting')

        self._connection.open()
      }, 1000)
    })

    self._connection.open()
  }
}
