/* eslint-disable mocha/no-setup-in-describe */
/* eslint-disable mocha/no-hooks-for-single-case */

const assert = require('chai').assert
const logger = require('winston')
const rewireMock = require('rewiremock/node')

rewireMock.enable()

rewireMock('serialport').by('./mocks/serialport')

const SmartMeter = require('../lib')

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

const dsmr3 = [
  '/ISk5\\2MT382-1000\r',
  '0-0:96.1.1(4B384547303034303436333935353037)\r',
  '1-0:1.8.1(12345.678*kWh)\r',
  '1-0:1.8.2(12345.678*kWh)\r',
  '1-0:2.8.1(12345.678*kWh)\r',
  '1-0:2.8.2(12345.678*kWh)\r',
  '0-0:96.14.0(0002)\r',
  '1-0:1.7.0(001.19*kW)\r',
  '1-0:2.7.0(000.00*kW)\r',
  '0-0:17.0.0(016*A)\r',
  '0-0:96.3.10(1)\r',
  '0-0:96.13.1(303132333435363738)\r',
  '0-0:96.13.0(303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F 303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F 303132333435363738393A3B3C3D3E3F)\r',
  '0-1:96.1.0(3232323241424344313233343536373839)\r',
  '0-1:24.1.0(03)\r',
  '0-1:24.3.0(090212160000)(00)(60)(1)(0-1:24.2.1)(m3)\r',
  '(00000.000)\r',
  '0-1:24.4.0(1)\r',
  '!'
]

const dsmr3Update = [
  '/ISk5\\2MT382-1000\r',
  '0-0:96.1.1(4B384547303034303436333935353037)\r',
  '1-0:1.8.1(12367.890*kWh)\r',
  '1-0:1.8.2(12345.678*kWh)\r',
  '1-0:2.8.1(12345.678*kWh)\r',
  '1-0:2.8.2(12345.678*kWh)\r',
  '0-0:96.14.0(0002)\r',
  '1-0:1.7.0(001.19*kW)\r',
  '1-0:2.7.0(000.00*kW)\r',
  '0-0:17.0.0(016*A)\r',
  '0-0:96.3.10(1)\r',
  '0-0:96.13.1(303132333435363738)\r',
  '0-0:96.13.0(303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F 303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F 303132333435363738393A3B3C3D3E3F)\r',
  '0-1:96.1.0(3232323241424344313233343536373839)\r',
  '0-1:24.1.0(03)\r',
  '0-1:24.3.0(090212180000)(00)(60)(1)(0-1:24.2.1)(m3)\r',
  '(00000.010)\r',
  '0-1:24.4.0(1)\r',
  '!'
]

const dsmr5 = [
  '/XMX5LGF0010455307579\r',
  '\r',
  '1-3:0.2.8(50)\r',
  '0-0:1.0.0(201003203959S)\r',
  '0-0:96.1.1(4530303637303035353330373537393230)\r',
  '1-0:1.8.1(000526.479*kWh)\r',
  '1-0:1.8.2(000583.955*kWh)\r',
  '1-0:2.8.1(000000.000*kWh)\r',
  '1-0:2.8.2(000000.000*kWh)\r',
  '0-0:96.14.0(0001)\r',
  '1-0:1.7.0(00.781*kW)\r',
  '1-0:2.7.0(00.000*kW)\r',
  '0-0:96.7.21(00010)\r',
  '0-0:96.7.9(00002)\r',
  '1-0:99.97.0(1)(0-0:96.7.19)(000101010000W)(0000000232*s)\r',
  '1-0:32.32.0(00006)\r',
  '1-0:52.32.0(00005)\r',
  '1-0:72.32.0(00005)\r',
  '1-0:32.36.0(00000)\r',
  '1-0:52.36.0(00000)\r',
  '1-0:72.36.0(00000)\r',
  '0-0:96.13.0()\r',
  '1-0:32.7.0(230.2*V)\r',
  '1-0:52.7.0(234.3*V)\r',
  '1-0:72.7.0(228.7*V)\r',
  '1-0:31.7.0(001*A)\r',
  '1-0:51.7.0(002*A)\r',
  '1-0:71.7.0(000*A)\r',
  '1-0:21.7.0(00.298*kW)\r',
  '1-0:41.7.0(00.458*kW)\r',
  '1-0:61.7.0(00.025*kW)\r',
  '1-0:22.7.0(00.000*kW)\r',
  '1-0:42.7.0(00.000*kW)\r',
  '1-0:62.7.0(00.000*kW)\r',
  '0-1:24.1.0(003)\r',
  '0-1:96.1.0(4730303738353635353836323132323230)\r',
  '0-1:24.2.1(201003203926S)(00035.545*m3)\r',
  '!459C'
]

const dsmr5Error = [
  '/XMX5LGF0010455307579\r',
  '\r',
  '1-3:0.2.8(50)\r',
  '0-0:1.0.0(201003203959S)\r',
  '0-0:96.1.1(4530303637303035353330373537393230)\r',
  '1-0:1.8.1(000526.479*kWh)\r',
  '1-0:1.8.2(000583.955*kWh)\r',
  '1-0:2.8.1(000000.000*kWh)\r',
  '1-0:2.8.2(000000.000*kWh)\r',
  '0-0:96.14.0(0001)\r',
  '1-0:1.7.0(00.781*kW)\r',
  '1-0:2.7.0(00.000*kW)\r',
  '0-0:96.7.21(00010)\r',
  '0-0:96.7.9(00002)\r',
  '1-0:99.97.0(1)(0-0:96.7.19)(000101010000W)(0000000232*s)\r',
  '1-0:32.32.0(00006)\r',
  '1-0:52.32.0(00005)\r',
  '1-0:72.32.0(00005)\r',
  '1-0:32.36.0(00000)\r',
  '1-0:52.36.0(00000)\r',
  '1-0:72.36.0(00000)\r',
  '0-0:96.13.0()\r',
  '1-0:32.7.0(230.2*V)\r',
  '1-0:52.7.0(234.3*V)\r',
  '1-0:72.7.0(228.7*V)\r',
  '1-0:31.7.0(001*A)\r',
  '1-0:51.7.0(002*A)\r',
  '1-0:71.7.0(000*A)\r',
  '1-0:21.7.0(00.298*kW)\r',
  '1-0:41.7.0(00.458*kW)\r',
  '1-0:61.7.0(00.025*kW)\r',
  '1-0:22.7.0(00.000*kW)\r',
  '1-0:42.7.0(00.000*kW)\r',
  '1-0:62.7.0(00.000*kW)\r',
  '0-1:24.1.0(003)\r',
  '0-1:96.1.0(4730303738353635353836323132323230)\r',
  '0-1:24.2.1(201003203926S)(00035.545*m3)\r',
  '!459D'
]

var meter
var eventTelegram
var eventUpdate

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
        actualConsumed: 1.19,
        actualProduced: 0,
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
    var actualUpdates = {
      power: {
        actualConsumed: 1.19,
        actualProduced: 0
      }
    }
    var updates

    before(function (done) {
      eventTelegram = false
      eventUpdate = false

      meter.on('telegram', (data) => {
        eventTelegram = true
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

    // The update event should always be received when actual power consumption
    // and/or production is reported
    it('the update event should be received', function () {
      assert.strictEqual(eventUpdate, true, 'the updates event has not been set')
    })

    it('the updates object should contain only the updates', function () {
      assert.deepEqual(updates, actualUpdates, 'the updates object does not contain the updates only')
    })
  })

  describe('process telegram with correct checksum: ', function () {
    before(function (done) {
      eventUpdate = false

      meter.on('telegram', (data) => {
        eventTelegram = true
      })

      meter.on('update', (data) => {
        eventUpdate = true
      })

      meter._connection._connection.mockData(dsmr5)

      // Wait
      setTimeout(() => {
        done()
      }, 100)
    })

    it('the telegram event should be received', function () {
      assert.strictEqual(eventTelegram, true, 'the telegram event has not been set')
    })

    it('the update event should be received', function () {
      assert.strictEqual(eventUpdate, true, 'the updates event has not been set')
    })
  })

  describe('process telegram with in-correct checksum: ', function () {
    before(function (done) {
      eventUpdate = false

      meter.on('telegram', (data) => {
        eventTelegram = true
      })

      meter.on('update', (data) => {
        eventUpdate = true
      })

      meter._connection._connection.mockData(dsmr5Error)

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

  describe('process telegram with in-correct checksum and option to ignore CRC: ', function () {
    before(function (done) {
      eventUpdate = false

      meter.on('telegram', (data) => {
        eventTelegram = true
      })

      meter.on('update', (data) => {
        eventUpdate = true
      })

      meter._ignoreCrc = true
      meter._connection._connection.mockData(dsmr5Error)

      // Wait
      setTimeout(() => {
        done()
      }, 100)
    })

    it('the telegram event should be received', function () {
      assert.strictEqual(eventTelegram, true, 'the telegram event has not been set')
    })

    it('the update event should be received', function () {
      assert.strictEqual(eventUpdate, true, 'the updates event has not been set')
    })
  })
})