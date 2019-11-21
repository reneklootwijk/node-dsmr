/* eslint-disable mocha/no-setup-in-describe */
/* eslint-disable mocha/no-hooks-for-single-case */

const assert = require('chai').assert
const logger = require('winston')
const rewireMock = require('rewiremock/node')

rewireMock.enable()

rewireMock('serialport').by('./mocks/serialport')

const SmartMeter = require('../lib')

const dsmr3 = [
  '/ISk5\\2MT382-1000',
  '0-0:96.1.1(4B384547303034303436333935353037)',
  '1-0:1.8.1(12345.678*kWh)',
  '1-0:1.8.2(12345.678*kWh)',
  '1-0:2.8.1(12345.678*kWh)',
  '1-0:2.8.2(12345.678*kWh)',
  '0-0:96.14.0(0002)',
  '1-0:1.7.0(001.19*kW)',
  '1-0:2.7.0(000.00*kW)',
  '0-0:17.0.0(016*A)',
  '0-0:96.3.10(1)',
  '0-0:96.13.1(303132333435363738)',
  '0-0:96.13.0(303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F 303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F 303132333435363738393A3B3C3D3E3F)',
  '0-1:96.1.0(3232323241424344313233343536373839)',
  '0-1:24.1.0(03)',
  '0-1:24.3.0(090212160000)(00)(60)(1)(0-1:24.2.1)(m3)',
  '(00000.000)',
  '0-1:24.4.0(1)',
  '!'
]

const dsmr3Update = [
  '/ISk5\\2MT382-1000',
  '0-0:96.1.1(4B384547303034303436333935353037)',
  '1-0:1.8.1(12367.890*kWh)',
  '1-0:1.8.2(12345.678*kWh)',
  '1-0:2.8.1(12345.678*kWh)',
  '1-0:2.8.2(12345.678*kWh)',
  '0-0:96.14.0(0002)',
  '1-0:1.7.0(001.19*kW)',
  '1-0:2.7.0(000.00*kW)',
  '0-0:17.0.0(016*A)',
  '0-0:96.3.10(1)',
  '0-0:96.13.1(303132333435363738)',
  '0-0:96.13.0(303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F 303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F 303132333435363738393A3B3C3D3E3F)',
  '0-1:96.1.0(3232323241424344313233343536373839)',
  '0-1:24.1.0(03)',
  '0-1:24.3.0(090212180000)(00)(60)(1)(0-1:24.2.1)(m3)',
  '(00000.010)',
  '0-1:24.4.0(1)',
  '!'
]

var meter
var eventTelegram
var eventUpdate

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

describe('Integration test:', function () {
  meter = new SmartMeter({
    port: '/dev/ttyUSB0',
    baudrate: 9600,
    databits: 7,
    parity: 'even'
  })

  // Connect to smartmeter
  meter.connect()

  describe('process initial telegram: ', function () {
    var telegram
    var updates

    before(function (done) {
      eventTelegram = false
      eventUpdate = false

      meter.on('telegram', (data) => {
        eventTelegram = true
        telegram = data
      })

      meter.on('update', (data) => {
        eventUpdate = true
        updates = data
      })

      meter._connection._connection.mockData(dsmr3)

      // Wait
      setTimeout(() => {
        done()
      }, 100)
    })

    it('the telegram event should be received', function () {
      assert.strictEqual(eventTelegram, true, 'the telegram event has not been set')
    })

    it('the updates event should be received', function () {
      assert.strictEqual(eventUpdate, true, 'the updates event has not been set')
    })

    it('the telegram and updates object should be equal', function () {
      assert.deepEqual(telegram, updates, 'the telegram and updates object are not equal')
    })
  })

  describe('process updates: ', function () {
    var telegram
    var updates
    var actualUpdates = {
      gas: {
        timestamp: 1234458000,
        totalConsumed: 0.01
      },
      power: {
        totalConsumed1: 12367.89
      }
    }

    before(function (done) {
      eventTelegram = false
      eventUpdate = false

      meter.on('telegram', (data) => {
        eventTelegram = true
        telegram = data
      })

      meter.on('update', (data) => {
        eventUpdate = true
        updates = data
      })

      meter._connection._connection.mockData(dsmr3Update)

      // Wait
      setTimeout(() => {
        done()
      }, 100)
    })

    it('the telegram event should be received', function () {
      assert.strictEqual(eventTelegram, true, 'the telegram event has not been set')
    })

    it('the updates event should be received', function () {
      assert.strictEqual(eventUpdate, true, 'the updates event has not been set')
    })

    it('the telegram and updates object should not be equal', function () {
      assert.notDeepEqual(telegram, updates, 'the telegram and updates object are equal')
    })

    it('the updates object should contain only the updates', function () {
      assert.deepEqual(updates, actualUpdates, 'the updates object does not contain the updates only')
    })
  })

  describe('process updates when there are none: ', function () {
    before(function (done) {
      eventTelegram = false
      eventUpdate = false

      meter.on('telegram', (data) => {
        eventTelegram = true
      })

      meter.on('update', (data) => {
        eventUpdate = true
      })

      meter._connection._connection.mockData(dsmr3Update)

      // Wait
      setTimeout(() => {
        done()
      }, 100)
    })

    it('the telegram event should be received', function () {
      assert.strictEqual(eventTelegram, true, 'the telegram event has not been set')
    })

    it('the update event should not be received', function () {
      assert.strictEqual(eventUpdate, false, 'the updates event has been set')
    })
  })
})
