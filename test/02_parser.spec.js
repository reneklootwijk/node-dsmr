const assert = require('chai').assert
const parser = require('../lib/parser')

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

const dsmr4 = [
  '/ISk5\\2MT382-1000',
  '1-3:0.2.8(40)',
  '0-0:1.0.0(101209113020W)',
  '0-0:96.1.1(4B384547303034303436333935353037)',
  '1-0:1.8.1(123456.789*kWh)',
  '1-0:1.8.2(123456.789*kWh)',
  '1-0:2.8.1(123456.789*kWh)',
  '1-0:2.8.2(123456.789*kWh)',
  '0-0:96.14.0(0002)',
  '1-0:1.7.0(01.193*kW)',
  '1-0:2.7.0(00.000*kW)',
  '0-0:17.0.0(016.1*kW)',
  '0-0:96.3.10(1)',
  '0-0:96.7.21(00004)',
  '0-0:96.7.9(00002)',
  '1-0:99:97.0(2)(0:96.7.19)(101208152415W)(0000000240*s)(101208151004W)(00000000301*s)',
  '1-0:32.32.0(00002)',
  '1-0:52.32.0(00001)',
  '1-0:72:32.0(00000)',
  '1-0:32.36.0(00000)',
  '1-0:52.36.0(00003)',
  '1-0:72.36.0(00000)',
  '0-0:96.13.1(3031203631203831)',
  '0-0:96.13.0(303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F)',
  '0-1:24.1.0(03)',
  '0-1:96.1.0(3232323241424344313233343536373839)',
  '0-1:24.2.1(101209110000W)(12785.123*m3)',
  '0-1:24.4.0(1)',
  '!F46A'
]

const dsmr5 = [
  '/ISk5\\2MT382-1000',
  '1-3:0.2.8(50)',
  '0-0:1.0.0(101209113020W)',
  '0-0:96.1.1(4B384547303034303436333935353037)',
  '1-0:1.8.1(123456.789*kWh)',
  '1-0:1.8.2(123456.789*kWh)',
  '1-0:2.8.1(123456.789*kWh)',
  '1-0:2.8.2(123456.789*kWh)',
  '0-0:96.14.0(0002)',
  '1-0:1.7.0(01.193*kW)',
  '1-0:2.7.0(00.000*kW)',
  '0-0:96.7.21(00004)',
  '0-0:96.7.9(00002)',
  '1-0:99.97.0(2)(0-0:96.7.19)(101208152415W)(0000000240*s)(101208151004W)(0000000301*s)',
  '1-0:32.32.0(00002)',
  '1-0:52.32.0(00001)',
  '1-0:72.32.0(00000)',
  '1-0:32.36.0(00000)',
  '1-0:52.36.0(00003)',
  '1-0:72.36.0(00000)',
  '0-0:96.13.0(303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C 3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F)',
  '1-0:32.7.0(220.1*V)',
  '1-0:52.7.0(220.2*V)',
  '1-0:72.7.0(220.3*V)',
  '1-0:31.7.0(001*A)',
  '1-0:51.7.0(002*A)',
  '1-0:71.7.0(003*A)',
  '1-0:21.7.0(01.111*kW)',
  '1-0:41.7.0(02.222*kW)',
  '1-0:61.7.0(03.333*kW)',
  '1-0:22.7.0(04.444*kW)',
  '1-0:42.7.0(05.555*kW)',
  '1-0:62.7.0(06.666*kW)',
  '0-1:24.1.0(003)',
  '0-1:96.1.0(3232323241424344313233343536373839)',
  '0-1:24.2.1(101209112500W)(12785.123*m3)',
  '!EF2F'
]

describe('Parser tests:', function () {
  describe('parse DSMR 3.x telegram', function () {
    var result

    before(function (done) {
      // Parse DSMR 3 message
      result = parser(dsmr3)

      done()
    })

    it('the meter model should have been determined', function () {
      assert.strictEqual(result.meterModel, 'ISk5\\2MT382-1000', 'wrong meter model')
    })

    it('the power equipment Id should have been determined', function () {
      assert.strictEqual(result.power.equipmentId, 'K8EG004046395507', 'wrong equipment Id')
    })

    it('the consumed power should have been determined', function () {
      assert.strictEqual(result.power.actualConsumed, 1.19, 'wrong actual power consumption')
      assert.strictEqual(result.power.totalConsumed1, 12345.678, 'wrong total power consumption in tariff 1')
      assert.strictEqual(result.power.totalConsumed2, 12345.678, 'wrong total power consumption in tariff 2')
    })

    it('the produced power should have been determined', function () {
      assert.strictEqual(result.power.actualProduced, 0, 'wrong actual power production')
      assert.strictEqual(result.power.totalProduced1, 12345.678, 'wrong total power production in tariff 1')
      assert.strictEqual(result.power.totalProduced2, 12345.678, 'wrong total power production in tariff 2')
    })

    it('the active power tariff should have been determined', function () {
      assert.strictEqual(result.power.activeTariff, 2, 'wrong active tariff')
    })

    it('the power switch position should have been determined', function () {
      assert.strictEqual(result.power.switchPosition, 1, 'wrong switch position')
    })

    it('the consumed gas should have been determined', function () {
      assert.strictEqual(result.gas.totalConsumed, 0, 'wrong total gas consumption')
      assert.strictEqual(result.gas.reportedPeriod, 60, 'wrong reported period')
    })

    it('the consumed gas timestamp should have been determined', function () {
      assert.strictEqual(result.gas.timestamp, 1234450800, 'wrong timestamp gas measurement')
    })

    it('the gas valve position should have been determined', function () {
      assert.strictEqual(result.gas.valvePosition, 1, 'wrong valve position')
    })
  })

  describe('parse DSMR 4.x telegram', function () {
    var result

    before(function (done) {
      // Parse DSMR 4 message
      result = parser(dsmr4)

      done()
    })

    it('the dsmr version should have been determined', function () {
      assert.strictEqual(result.dsmrVersion, 4, 'wrong version')
    })

    it('the meter model should have been determined', function () {
      assert.strictEqual(result.meterModel, 'ISk5\\2MT382-1000', 'wrong meter model')
    })

    it('the power equipment Id should have been determined', function () {
      assert.strictEqual(result.power.equipmentId, 'K8EG004046395507', 'wrong equipment Id')
    })

    it('the consumed power should have been determined', function () {
      assert.strictEqual(result.power.actualConsumed, 1.193, 'wrong actual power consumption')
      assert.strictEqual(result.power.totalConsumed1, 123456.789, 'wrong total power consumption in tariff 1')
      assert.strictEqual(result.power.totalConsumed2, 123456.789, 'wrong total power consumption in tariff 2')
    })

    it('the produced power should have been determined', function () {
      assert.strictEqual(result.power.actualProduced, 0, 'wrong actual power production')
      assert.strictEqual(result.power.totalProduced1, 123456.789, 'wrong total power production in tariff 1')
      assert.strictEqual(result.power.totalProduced2, 123456.789, 'wrong total power production in tariff 2')
    })

    it('the active power tariff should have been determined', function () {
      assert.strictEqual(result.power.activeTariff, 2, 'wrong active tariff')
    })

    it('the power switch position should have been determined', function () {
      assert.strictEqual(result.power.switchPosition, 1, 'wrong switch position')
    })

    it('the gas equipment Id should have been determined', function () {
      assert.strictEqual(result.gas.equipmentId, '2222ABCD123456789', 'wrong equipment Id')
    })

    it('the consumed gas should have been determined', function () {
      assert.strictEqual(result.gas.totalConsumed, 12785.123, 'wrong total gas consumption')
      assert.strictEqual(result.gas.reportedPeriod, 60, 'wrong reported period')
    })

    it('the consumed gas timestampshould have been determined', function () {
      assert.strictEqual(result.gas.timestamp, 1291888800, 'wrong timestamp gas measurement')
    })

    it('the gas valve position should have been determined', function () {
      assert.strictEqual(result.gas.valvePosition, 1, 'wrong valve position')
    })

    it('the failures should have been determined', function () {
      assert.strictEqual(result.power.failures, 4, 'wrong number of failures')
      assert.strictEqual(result.power.failuresLong, 2, 'wrong number of long failures')
      assert.strictEqual(result.power.failureLog[0].timestampEnd, 1291818255, 'wrong timestamp')
      assert.strictEqual(result.power.failureLog[0].duration, 240, 'wrong duration')
      assert.strictEqual(result.power.failureLog[1].timestampEnd, 1291817404, 'wrong timestamp')
      assert.strictEqual(result.power.failureLog[1].duration, 301, 'wrong duration')
    })

    it('the voltage sags should have been determined', function () {
      assert.strictEqual(result.power.voltageSagsL1, 2, 'wrong voltage sags l1')
      assert.strictEqual(result.power.voltageSagsL2, 1, 'wrong voltage sags l2')
      assert.strictEqual(result.power.voltageSagsL3, 0, 'wrong voltage sags l3')
    })

    it('the voltage swells should have been determined', function () {
      assert.strictEqual(result.power.voltageSwellsL1, 0, 'wrong voltage swells l1')
      assert.strictEqual(result.power.voltageSwellsL2, 3, 'wrong voltage swells l2')
      assert.strictEqual(result.power.voltageSwellsL3, 0, 'wrong voltage swells l3')
    })
  })

  describe('parse DSMR 5.x telegram', function () {
    var result

    before(function (done) {
      // Parse DSMR 5.x message
      result = parser(dsmr5)

      done()
    })

    it('the dsmr version should have been determined', function () {
      assert.strictEqual(result.dsmrVersion, 5, 'wrong version')
    })

    it('the meter model should have been determined', function () {
      assert.strictEqual(result.meterModel, 'ISk5\\2MT382-1000', 'wrong meter model')
    })

    it('the power equipment Id should have been determined', function () {
      assert.strictEqual(result.power.equipmentId, 'K8EG004046395507', 'wrong equipment Id')
    })

    it('the consumed power should have been determined', function () {
      assert.strictEqual(result.power.actualConsumed, 1.193, 'wrong actual power consumption')
      assert.strictEqual(result.power.totalConsumed1, 123456.789, 'wrong total power consumption in tariff 1')
      assert.strictEqual(result.power.totalConsumed2, 123456.789, 'wrong total power consumption in tariff 2')
    })

    it('the produced power should have been determined', function () {
      assert.strictEqual(result.power.actualProduced, 0, 'wrong actual power production')
      assert.strictEqual(result.power.totalProduced1, 123456.789, 'wrong total power production in tariff 1')
      assert.strictEqual(result.power.totalProduced2, 123456.789, 'wrong total power production in tariff 2')
    })

    it('the active power tariff should have been determined', function () {
      assert.strictEqual(result.power.activeTariff, 2, 'wrong active tariff')
    })

    it('the gas equipment Id should have been determined', function () {
      assert.strictEqual(result.gas.equipmentId, '2222ABCD123456789', 'wrong equipment Id')
    })

    it('the consumed gas should have been determined', function () {
      assert.strictEqual(result.gas.totalConsumed, 12785.123, 'wrong total gas consumption')
      assert.strictEqual(result.gas.reportedPeriod, 5, 'wrong reported period')
    })

    it('the consumed gas timestamp should have been determined', function () {
      assert.strictEqual(result.gas.timestamp, 1291890300, 'wrong timestamp gas measurement')
    })

    it('the failures should have been determined', function () {
      assert.strictEqual(result.power.failures, 4, 'wrong number of failures')
      assert.strictEqual(result.power.failuresLong, 2, 'wrong number of long failures')
      assert.strictEqual(result.power.failureLog[0].timestampEnd, 1291818255, 'wrong timestamp')
      assert.strictEqual(result.power.failureLog[0].duration, 240, 'wrong duration')
      assert.strictEqual(result.power.failureLog[1].timestampEnd, 1291817404, 'wrong timestamp')
      assert.strictEqual(result.power.failureLog[1].duration, 301, 'wrong duration')
    })

    it('the voltage sags should have been determined', function () {
      assert.strictEqual(result.power.voltageSagsL1, 2, 'wrong voltage sags l1')
      assert.strictEqual(result.power.voltageSagsL2, 1, 'wrong voltage sags l2')
      assert.strictEqual(result.power.voltageSagsL3, 0, 'wrong voltage sags l3')
    })

    it('the voltage swells should have been determined', function () {
      assert.strictEqual(result.power.voltageSwellsL1, 0, 'wrong voltage swells l1')
      assert.strictEqual(result.power.voltageSwellsL2, 3, 'wrong voltage swells l2')
      assert.strictEqual(result.power.voltageSwellsL3, 0, 'wrong voltage swells l3')
    })

    it('the instantaneous voltage should have been determined', function () {
      assert.strictEqual(result.power.instantaneousVoltageL1, 220.1, 'wrong instantaneous voltage l1')
      assert.strictEqual(result.power.instantaneousVoltageL2, 220.2, 'wrong instantaneous voltage l2')
      assert.strictEqual(result.power.instantaneousVoltageL3, 220.3, 'wrong instantaneous voltage l3')
    })

    it('the instantaneous produced electricity should have been determined', function () {
      assert.strictEqual(result.power.instantaneousProducedElectricityL1, 4.444, 'wrong instantaneous produced electricity l1')
      assert.strictEqual(result.power.instantaneousProducedElectricityL2, 5.555, 'wrong instantaneous produced electricity l2')
      assert.strictEqual(result.power.instantaneousProducedElectricityL3, 6.666, 'wrong instantaneous produced electricity l3')
    })

    it('the instantaneous consumed electricity should have been determined', function () {
      assert.strictEqual(result.power.instantaneousConsumedElectricityL1, 1.111, 'wrong instantaneous consumed electricity l1')
      assert.strictEqual(result.power.instantaneousConsumedElectricityL2, 2.222, 'wrong instantaneous consumed electricity l2')
      assert.strictEqual(result.power.instantaneousConsumedElectricityL3, 3.333, 'wrong instantaneous consumed electricity l3')
    })
  })
})
