/* eslint-disable mocha/no-hooks-for-single-case */

const assert = require('chai').assert
const logger = require('winston')
const rewireMock = require('rewiremock/node')

rewireMock.enable()

rewireMock('@serialport/parser-readline').by('./mocks/serialport')
rewireMock('serialport').by('./mocks/serialport')

const SmartMeter = require('../lib')

var meter
var eventConnected
var eventDisconnected

// Initialize logger
logger.remove(logger.transports.Console)
logger.add(new logger.transports.Console({
  format: logger.format.combine(
    logger.format.timestamp(),
    logger.format.colorize(),
    logger.format.printf(event => {
      return `${event.timestamp} ${event.level}: ${event.message}`
    })
  ),
  level: 'none'
}))

describe('Connection tests:', function () {
  describe('instantiate meter object', function () {
    it('creating the meter object without specifying a port should throw an error', function () {
      assert.throws(() => {
        meter = new SmartMeter({ type: 'serial' })
      }, 'Cannot create serial connection, no port specified', 'should have thrown an error')
    })

    it('creating the meter object', function () {
      assert.doesNotThrow(() => {
        meter = new SmartMeter({
          port: '/dev/ttyUSB0',
          baudrate: 9600,
          databits: 7,
          parity: 'even'
        })
      })
    })
  })

  describe('connect to P1 port: ', function () {
    before(function (done) {
      // Reset flags
      eventConnected = false

      meter.on('connected', () => {
        eventConnected = true
      })

      // Connect to smartmeter
      meter.connect()

      // Wait
      setTimeout(() => {
        done()
      }, 100)
    })

    it('the connected event should have been received', function () {
      assert.strictEqual(eventConnected, true, 'connected event has not been received')
    })

    it('the connected flag in the Connection class should be set', function () {
      assert.strictEqual(meter._connection._connected, true, 'connected flag has not been set')
    })
  })

  describe('reconnect when connection is closed: ', function () {
    before(function (done) {
      // Reset flags
      eventConnected = false
      eventDisconnected = false

      meter.on('connected', () => {
        eventConnected = true
      })

      meter.on('disconnected', () => {
        eventDisconnected = true
      })

      meter._connection._connection.mockDisconnect()

      // Wait
      setTimeout(() => {
        done()
      }, 1500)
    })

    it('the disconnected event should have been received', function () {
      assert.strictEqual(eventDisconnected, true, 'disconnected event has not been received')
    })

    it('the connected event should have been received', function () {
      assert.strictEqual(eventConnected, true, 'connected event has not been received')
    })

    it('the connected flag in the Connection class should be set', function () {
      assert.strictEqual(meter._connection._connected, true, 'connected flag has not been set')
    })
  })
})
