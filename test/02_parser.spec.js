const assert = require('chai').assert;
const parser = require('../lib/parser');

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
  '0-0:96.13.0(303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F)\r',
  '0-1:96.1.0(3232323241424344313233343536373839)\r',
  '0-1:24.1.0(03)\r',
  '0-1:24.3.0(090212160000)(00)(60)(1)(0-1:24.2.1)(m3)\r',
  '(00000.000)\r',
  '0-1:24.4.0(1)\r',
  '!'
];

const dsmr4 = [
  '/ISk5\\2MT382-1000\r',
  '1-3:0.2.8(40)\r',
  '0-0:1.0.0(101209113020W)\r',
  '0-0:96.1.1(4B384547303034303436333935353037)\r',
  '1-0:1.8.1(123456.789*kWh)\r',
  '1-0:1.8.2(123456.789*kWh)\r',
  '1-0:2.8.1(123456.789*kWh)\r',
  '1-0:2.8.2(123456.789*kWh)\r',
  '0-0:96.14.0(0002)\r',
  '1-0:1.7.0(01.193*kW)\r',
  '1-0:2.7.0(00.000*kW)\r',
  '0-0:17.0.0(016*A)\r',
  '0-0:96.3.10(1)\r',
  '0-0:96.7.21(00004)\r',
  '0-0:96.7.9(00002)\r',
  '1-0:99:97.0(2)(0:96.7.19)(101208152415W)(0000000240*s)(101208151004W)(00000000301*s)\r',
  '1-0:32.32.0(00002)\r',
  '1-0:52.32.0(00001)\r',
  '1-0:72:32.0(00000)\r',
  '1-0:32.36.0(00000)\r',
  '1-0:52.36.0(00003)\r',
  '1-0:72.36.0(00000)\r',
  '0-0:96.13.1(3031203631203831)\r',
  '0-0:96.13.0(303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F)\r',
  '0-1:24.1.0(03)\r',
  '0-1:96.1.0(3232323241424344313233343536373839)\r',
  '0-1:24.2.1(101209110000W)(12785.123*m3)\r',
  '0-1:24.4.0(1)\r',
  '!F46A'
];

const dsmr5 = [
  '/ISk5\\2MT382-1000\r',
  '1-3:0.2.8(50)\r',
  '0-0:1.0.0(101209113020W)\r',
  '0-0:96.1.1(4B384547303034303436333935353037)\r',
  '1-0:1.8.1(123456.789*kWh)\r',
  '1-0:1.8.2(123456.789*kWh)\r',
  '1-0:2.8.1(123456.789*kWh)\r',
  '1-0:2.8.2(123456.789*kWh)\r',
  '0-0:96.14.0(0002)\r',
  '1-0:1.7.0(01.193*kW)\r',
  '1-0:2.7.0(00.000*kW)\r',
  '0-0:96.7.21(00004)\r',
  '0-0:96.7.9(00002)\r',
  '1-0:99.97.0(2)(0-0:96.7.19)(101208152415W)(0000000240*s)(101208151004W)(0000000301*s)\r',
  '1-0:32.32.0(00002)\r',
  '1-0:52.32.0(00001)\r',
  '1-0:72.32.0(00000)\r',
  '1-0:32.36.0(00000)\r',
  '1-0:52.36.0(00003)\r',
  '1-0:72.36.0(00000)\r',
  '0-0:96.13.0(303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C 3D3E3F303132333435363738393A3B3C3D3E3F303132333435363738393A3B3C3D3E3F)\r',
  '1-0:32.7.0(220.1*V)\r',
  '1-0:52.7.0(220.2*V)\r',
  '1-0:72.7.0(220.3*V)\r',
  '1-0:31.7.0(001*A)\r',
  '1-0:51.7.0(002*A)\r',
  '1-0:71.7.0(003*A)\r',
  '1-0:21.7.0(01.111*kW)\r',
  '1-0:41.7.0(02.222*kW)\r',
  '1-0:61.7.0(03.333*kW)\r',
  '1-0:22.7.0(04.444*kW)\r',
  '1-0:42.7.0(05.555*kW)\r',
  '1-0:62.7.0(06.666*kW)\r',
  '0-1:24.1.0(003)\r',
  '0-1:96.1.0(3232323241424344313233343536373839)\r',
  '0-1:24.2.1(101209112500W)(12785.123*m3)\r',
  '!EF2F'
];

const emucs171 = [
  '/FLU5\\253769484_A\r',
  '0-0:96.1.4(50217)\r',
  '0-0:96.1.1(3153414733313031303231363035)\r',
  '0-0:1.0.0(200512135409S)\r',
  '1-0:1.8.1(000000.034*kWh)\r',
  '1-0:1.8.2(000015.758*kWh)\r',
  '1-0:2.8.1(000000.000*kWh)\r',
  '1-0:2.8.2(000000.011*kWh)\r',
  '1-0:1.4.0(02.351*kW)\r',
  '1-0:1.6.0(200509134558S)(02.589*kW)\r',
  '0-0:98.1.0(3)(1-0:1.6.0)(1-0:1.6.0)(200501000000S)(200423192538S)(03.695*kW)(200401000000S)(200305122139S)(05.980*kW)(200301000000S)(200210035421W)(04.318*kW)\r',
  '1-0:2.7.0(00.000*kW)\r',
  '1-0:21.7.0(00.000*kW)\r',
  '1-0:41.7.0(00.000*kW)\r',
  '1-0:61.7.0(00.000*kW)\r',
  '1-0:22.7.0(00.000*kW)\r',
  '1-0:42.7.0(00.000*kW)\r',
  '1-0:62.7.0(00.000*kW)\r',
  '1-0:32.7.0(234.7*V)\r',
  '1-0:52.7.0(234.7*V)\r',
  '1-0:72.7.0(234.7*V)\r',
  '1-0:31.7.0(000.00*A)\r',
  '1-0:51.7.0(000.00*A)\r',
  '1-0:71.7.0(000.00*A)\r',
  '0-0:96.3.10(1)\r',
  '0-0:17.0.0(999.9*kW)\r',
  '1-0:31.4.0(999*A)\r',
  '0-0:96.13.0()\r',
  '0-1:24.1.0(003)\r',
  '0-1:96.1.1(37464C4F32313139303333373333)\r',
  '0-1:24.4.0(1)\r',
  '0-1:24.2.3(200512134558S)(00112.384*m3)\r',
  '0-2:24.1.0(007)\r',
  '0-2:96.1.1(3853414731323334353637383930)\r',
  '0-2:24.2.1(200512134558S)(00872.234*m3)\r',
  '!XXX'
];

describe('Parser tests:', function () {
  describe('parse DSMR 3.x telegram', function () {
    var result;

    before(function (done) {
      // Parse DSMR 3 message
      result = parser(dsmr3);

      done();
    });

    it('the meter model should have been determined', function () {
      assert.strictEqual(result.meterModel, 'ISk5\\2MT382-1000', 'wrong meter model');
    });

    it('the meters connected should have been determined', function () {
      assert(result.connectedMeters, 'No connected meters reported');
      assert.strictEqual(result.connectedMeters.length, 1, 'wrong number of connected meters');
      assert.strictEqual(result.connectedMeters[0].description, 'Gas meter', 'wrong description of connected meter');
    });

    it('the electricity equipment Id should have been determined', function () {
      assert.strictEqual(result.electricity.equipmentId, 'K8EG004046395507', 'wrong equipment Id for electricity');
    });

    it('the gas equipment Id should have been determined', function () {
      assert.strictEqual(result.gas.equipmentId, '2222ABCD123456789', 'wrong equipment Id for gas');
    });

    it('the limiter thresholds should have been determined', function () {
      assert.strictEqual(result.electricity.thresholdA, 16, 'Wrong limiter threshold in A');
    });

    it('the consumed electricity should have been determined', function () {
      assert.strictEqual(result.electricity.actualConsumed, 1.19, 'wrong actual electricity consumption');
      assert.strictEqual(result.electricity.totalConsumed1, 12345.678, 'wrong total electricity consumption in tariff 1');
      assert.strictEqual(result.electricity.totalConsumed2, 12345.678, 'wrong total electricity consumption in tariff 2');
    });

    it('the produced electricity should have been determined', function () {
      assert.strictEqual(result.electricity.actualProduced, 0, 'wrong actual electricity production');
      assert.strictEqual(result.electricity.totalProduced1, 12345.678, 'wrong total electricity production in tariff 1');
      assert.strictEqual(result.electricity.totalProduced2, 12345.678, 'wrong total electricity production in tariff 2');
    });

    it('the active electricity tariff should have been determined', function () {
      assert.strictEqual(result.electricity.activeTariff, 2, 'wrong active tariff');
    });

    it('the electricity switch position should have been determined', function () {
      assert.strictEqual(result.electricity.switchPosition, 1, 'wrong switch position');
    });

    it('the consumed gas should have been determined', function () {
      assert.strictEqual(result.gas.totalConsumed, 0, 'wrong total gas consumption');
      assert.strictEqual(result.gas.reportedPeriod, 60, 'wrong reported period');
      assert.strictEqual(result.gas.timestamp, 1234450800, 'wrong timestamp gas measurement');
    });

    it('the gas valve position should have been determined', function () {
      assert.strictEqual(result.gas.valvePosition, 1, 'wrong valve position');
    });

    it('the messages should have been determined', function () {
      assert.strictEqual(result.messages.code, '012345678', 'wrong code message');
      assert.strictEqual(result.messages.text, '0123456789:;<=>?0123456789:;<=>?0123456789:;<=>?0123456789:;<=>?0123456789:;<=>?', 'wrong text message');
    });
  });

  describe('parse DSMR 4.x telegram', function () {
    var result;

    before(function (done) {
      // Parse DSMR 4 message
      result = parser(dsmr4);

      done();
    });

    it('the dsmr version should have been determined', function () {
      assert.strictEqual(result.dsmrVersion, 4, 'wrong version');
    });

    it('the telegram timestamp should have been determined', function () {
      assert.strictEqual(result.timestamp, 1291890620, 'wrong telegram timestamp');
    });

    it('the meter model should have been determined', function () {
      assert.strictEqual(result.meterModel, 'ISk5\\2MT382-1000', 'wrong meter model');
    });

    it('the meters connected should have been determined', function () {
      assert(result.connectedMeters, 'No connected meters reported');
      assert.strictEqual(result.connectedMeters.length, 1, 'wrong number of connected meters');
      assert.strictEqual(result.connectedMeters[0].description, 'Gas meter', 'wrong description of connected meter');
    });

    it('the electricity equipment Id should have been determined', function () {
      assert.strictEqual(result.electricity.equipmentId, 'K8EG004046395507', 'wrong equipment Id for electricity');
    });

    it('the gas equipment Id should have been determined', function () {
      assert.strictEqual(result.gas.equipmentId, '2222ABCD123456789', 'wrong equipment Id for gas');
    });

    it('the limiter thresholds should have been determined', function () {
      assert.strictEqual(result.electricity.thresholdA, 16, 'Wrong limiter threshold in A');
    });

    it('the consumed electricity should have been determined', function () {
      assert.strictEqual(result.electricity.actualConsumed, 1.193, 'wrong actual electricity consumption');
      assert.strictEqual(result.electricity.totalConsumed1, 123456.789, 'wrong total electricity consumption in tariff 1');
      assert.strictEqual(result.electricity.totalConsumed2, 123456.789, 'wrong total electricity consumption in tariff 2');
    });

    it('the produced electricity should have been determined', function () {
      assert.strictEqual(result.electricity.actualProduced, 0, 'wrong actual electricity production');
      assert.strictEqual(result.electricity.totalProduced1, 123456.789, 'wrong total electricity production in tariff 1');
      assert.strictEqual(result.electricity.totalProduced2, 123456.789, 'wrong total electricity production in tariff 2');
    });

    it('the active electricity tariff should have been determined', function () {
      assert.strictEqual(result.electricity.activeTariff, 2, 'wrong active tariff');
    });

    it('the electricity switch position should have been determined', function () {
      assert.strictEqual(result.electricity.switchPosition, 1, 'wrong switch position');
    });

    it('the consumed gas should have been determined', function () {
      assert.strictEqual(result.gas.totalConsumed, 12785.123, 'wrong total gas consumption');
      assert.strictEqual(result.gas.reportedPeriod, 60, 'wrong reported period');
    });

    it('the consumed gas timestampshould have been determined', function () {
      assert.strictEqual(result.gas.timestamp, 1291888800, 'wrong timestamp gas measurement');
    });

    it('the gas valve position should have been determined', function () {
      assert.strictEqual(result.gas.valvePosition, 1, 'wrong valve position');
    });

    it('the failures should have been determined', function () {
      assert.strictEqual(result.electricity.failures, 4, 'wrong number of failures');
      assert.strictEqual(result.electricity.failuresLong, 2, 'wrong number of long failures');
      assert.strictEqual(result.electricity.failureLog[0].timestampEnd, 1291818255, 'wrong timestamp');
      assert.strictEqual(result.electricity.failureLog[0].duration, 240, 'wrong duration');
      assert.strictEqual(result.electricity.failureLog[1].timestampEnd, 1291817404, 'wrong timestamp');
      assert.strictEqual(result.electricity.failureLog[1].duration, 301, 'wrong duration');
    });

    it('the voltage sags should have been determined', function () {
      assert.strictEqual(result.electricity.voltageSagsL1, 2, 'wrong voltage sags l1');
      assert.strictEqual(result.electricity.voltageSagsL2, 1, 'wrong voltage sags l2');
      assert.strictEqual(result.electricity.voltageSagsL3, 0, 'wrong voltage sags l3');
    });

    it('the voltage swells should have been determined', function () {
      assert.strictEqual(result.electricity.voltageSwellsL1, 0, 'wrong voltage swells l1');
      assert.strictEqual(result.electricity.voltageSwellsL2, 3, 'wrong voltage swells l2');
      assert.strictEqual(result.electricity.voltageSwellsL3, 0, 'wrong voltage swells l3');
    });
  });

  describe('parse DSMR 5.x telegram', function () {
    var result;

    before(function (done) {
      // Parse DSMR 5.x message
      result = parser(dsmr5);

      done();
    });

    it('the dsmr version should have been determined', function () {
      assert.strictEqual(result.dsmrVersion, 5, 'wrong version');
    });

    it('the telegram timestamp should have been determined', function () {
      assert.strictEqual(result.timestamp, 1291890620, 'wrong telegram timestamp');
    });

    it('the meter model should have been determined', function () {
      assert.strictEqual(result.meterModel, 'ISk5\\2MT382-1000', 'wrong meter model');
    });

    it('the meters connected should have been determined', function () {
      assert(result.connectedMeters, 'No connected meters reported');
      assert.strictEqual(result.connectedMeters.length, 1, 'wrong number of connected meters');
      assert.strictEqual(result.connectedMeters[0].description, 'Gas meter', 'wrong description of connected meter');
    });

    it('the electricity equipment Id should have been determined', function () {
      assert.strictEqual(result.electricity.equipmentId, 'K8EG004046395507', 'wrong equipment Id for electricity');
    });

    it('the gas equipment Id should have been determined', function () {
      assert.strictEqual(result.gas.equipmentId, '2222ABCD123456789', 'wrong equipment Id for gas');
    });

    it('the consumed electricity should have been determined', function () {
      assert.strictEqual(result.electricity.actualConsumed, 1.193, 'wrong actual electricity consumption');
      assert.strictEqual(result.electricity.totalConsumed1, 123456.789, 'wrong total electricity consumption in tariff 1');
      assert.strictEqual(result.electricity.totalConsumed2, 123456.789, 'wrong total electricity consumption in tariff 2');
    });

    it('the produced electricity should have been determined', function () {
      assert.strictEqual(result.electricity.actualProduced, 0, 'wrong actual electricity production');
      assert.strictEqual(result.electricity.totalProduced1, 123456.789, 'wrong total electricity production in tariff 1');
      assert.strictEqual(result.electricity.totalProduced2, 123456.789, 'wrong total electricity production in tariff 2');
    });

    it('the active electricity tariff should have been determined', function () {
      assert.strictEqual(result.electricity.activeTariff, 2, 'wrong active tariff');
    });

    it('the consumed gas should have been determined', function () {
      assert.strictEqual(result.gas.totalConsumed, 12785.123, 'wrong total gas consumption');
      assert.strictEqual(result.gas.reportedPeriod, 5, 'wrong reported period');
    });

    it('the consumed gas timestamp should have been determined', function () {
      assert.strictEqual(result.gas.timestamp, 1291890300, 'wrong timestamp gas measurement');
    });

    it('the failures should have been determined', function () {
      assert.strictEqual(result.electricity.failures, 4, 'wrong number of failures');
      assert.strictEqual(result.electricity.failuresLong, 2, 'wrong number of long failures');
      assert.strictEqual(result.electricity.failureLog[0].timestampEnd, 1291818255, 'wrong timestamp');
      assert.strictEqual(result.electricity.failureLog[0].duration, 240, 'wrong duration');
      assert.strictEqual(result.electricity.failureLog[1].timestampEnd, 1291817404, 'wrong timestamp');
      assert.strictEqual(result.electricity.failureLog[1].duration, 301, 'wrong duration');
    });

    it('the voltage sags should have been determined', function () {
      assert.strictEqual(result.electricity.voltageSagsL1, 2, 'wrong voltage sags l1');
      assert.strictEqual(result.electricity.voltageSagsL2, 1, 'wrong voltage sags l2');
      assert.strictEqual(result.electricity.voltageSagsL3, 0, 'wrong voltage sags l3');
    });

    it('the voltage swells should have been determined', function () {
      assert.strictEqual(result.electricity.voltageSwellsL1, 0, 'wrong voltage swells l1');
      assert.strictEqual(result.electricity.voltageSwellsL2, 3, 'wrong voltage swells l2');
      assert.strictEqual(result.electricity.voltageSwellsL3, 0, 'wrong voltage swells l3');
    });

    it('the instantaneous voltage should have been determined', function () {
      assert.strictEqual(result.electricity.instantaneousVoltageL1, 220.1, 'wrong instantaneous voltage l1');
      assert.strictEqual(result.electricity.instantaneousVoltageL2, 220.2, 'wrong instantaneous voltage l2');
      assert.strictEqual(result.electricity.instantaneousVoltageL3, 220.3, 'wrong instantaneous voltage l3');
    });

    it('the instantaneous produced power should have been determined', function () {
      assert.strictEqual(result.electricity.instantaneousProducedPowerL1, 4.444, 'wrong instantaneous produced power l1');
      assert.strictEqual(result.electricity.instantaneousProducedPowerL2, 5.555, 'wrong instantaneous produced power l2');
      assert.strictEqual(result.electricity.instantaneousProducedPowerL3, 6.666, 'wrong instantaneous produced power l3');
    });

    it('the instantaneous consumed power should have been determined', function () {
      assert.strictEqual(result.electricity.instantaneousConsumedPowerL1, 1.111, 'wrong instantaneous consumed power l1');
      assert.strictEqual(result.electricity.instantaneousConsumedPowerL2, 2.222, 'wrong instantaneous consumed power l2');
      assert.strictEqual(result.electricity.instantaneousConsumedPowerL3, 3.333, 'wrong instantaneous consumed power l3');
    });
  });

  describe('parse eMUCs 1.7.1 telegram', function () {
    var result;

    before(function (done) {
      // Parse eMUCs message
      result = parser(emucs171);

      done();
    });

    it('the dsmr version should have been determined', function () {
      assert.strictEqual(result.dsmrVersion, 5.0217, 'wrong version');
    });

    it('the meter model should have been determined', function () {
      assert.strictEqual(result.meterModel, 'FLU5\\253769484_A', 'wrong meter model');
    });

    it('the meters connected should have been determined', function () {
      assert(result.connectedMeters, 'No connected meters reported');
      assert.strictEqual(result.connectedMeters.length, 2, 'wrong number of connected meters');
      assert.strictEqual(result.connectedMeters[0].description, 'Gas meter', 'wrong description of connected meter');
      assert.strictEqual(result.connectedMeters[1].description, 'Water meter', 'wrong description of connected meter');
    });

    it('the electricity equipment Id should have been determined', function () {
      assert.strictEqual(result.electricity.equipmentId, '1SAG3101021605', 'wrong equipment Id for electricity');
    });

    it('the gas equipment Id should have been determined', function () {
      assert.strictEqual(result.gas.equipmentId, '7FLO2119033733', 'wrong equipment Id for gas');
    });

    it('the water equipment Id should have been determined', function () {
      assert.strictEqual(result.water.equipmentId, '8SAG1234567890', 'wrong equipment Id for water');
    });

    it('the limiter thresholds should have been determined', function () {
      assert.strictEqual(result.electricity.thresholdkW, 999.9, 'Wrong limiter threshold in kW');
    });

    it('the consumed electricity should have been determined', function () {
      // assert.strictEqual(result.electricity.actualConsumed, 1.193, 'wrong actual electricity consumption')
      assert.strictEqual(result.electricity.totalConsumed1, 0.034, 'wrong total electricity consumption in tariff 1');
      assert.strictEqual(result.electricity.totalConsumed2, 15.758, 'wrong total electricity consumption in tariff 2');
    });

    it('the produced electricity should have been determined', function () {
      assert.strictEqual(result.electricity.actualProduced, 0, 'wrong actual electricity production');
      assert.strictEqual(result.electricity.totalProduced1, 0, 'wrong total electricity production in tariff 1');
      assert.strictEqual(result.electricity.totalProduced2, 0.011, 'wrong total electricity production in tariff 2');
    });

    it('the active energy import should have been determined', function () {
      assert.strictEqual(result.electricity.capacity.import.avgDemand, 2.351, 'wrong avg demand');
    });

    it('the active energy import of the running month should have been determined', function () {
      assert.strictEqual(result.electricity.capacity.import.runningMonth.maxDemand, 2.589, 'wrong max demand');
      assert.strictEqual(result.electricity.capacity.import.runningMonth.timestamp, 1589024758, 'wrong max demand timestamp');
    });

    it('the active energy import history should have been determined', function () {
      assert.strictEqual(result.electricity.capacity.import.history.length, 3, 'wrong number of reported months');
      assert.strictEqual(result.electricity.capacity.import.history[0].start, 1588284000, 'wrong start timestamp period 3');
      assert.strictEqual(result.electricity.capacity.import.history[0].end, 1587662738, 'wrong stop timestamp period 3');
      assert.strictEqual(result.electricity.capacity.import.history[0].maxDemand, 3.695, 'wrong max. demand period 3');
      assert.strictEqual(result.electricity.capacity.import.history[1].start, 1585692000, 'wrong start timestamp period 2');
      assert.strictEqual(result.electricity.capacity.import.history[1].end, 1583407299, 'wrong stop timestamp period 2');
      assert.strictEqual(result.electricity.capacity.import.history[1].maxDemand, 5.98, 'wrong max. demand period 2');
      assert.strictEqual(result.electricity.capacity.import.history[2].start, 1583017200, 'wrong start timestamp period 1');
      assert.strictEqual(result.electricity.capacity.import.history[2].end, 1581303261, 'wrong stop timestamp period 1');
      assert.strictEqual(result.electricity.capacity.import.history[2].maxDemand, 4.318, 'wrong max. demand period 1');
    });

    it('the consumed water consumption should have been determined', function () {
      assert.strictEqual(result.water.totalConsumed, 872.234, 'wrong total water consumption');
      assert.strictEqual(result.water.timestamp, 1589283958, 'wrong timestamp water measurement')
      ;
      assert.strictEqual(result.water.reportedPeriod, 5, 'wrong reported period water consumption');
    });

    it('the consumed gas not corrected for temperature consumption should have been determined', function () {
      assert.strictEqual(result.gas.totalConsumed, 112.384, 'wrong total gas consumption');
      assert.strictEqual(result.gas.timestamp, 1589283958, 'wrong timestamp gas measurement');
    });

    it('the instantaneous voltage should have been determined', function () {
      assert.strictEqual(result.electricity.instantaneousVoltageL1, 234.7, 'wrong instantaneous voltage l1');
      assert.strictEqual(result.electricity.instantaneousVoltageL2, 234.7, 'wrong instantaneous voltage l2');
      assert.strictEqual(result.electricity.instantaneousVoltageL3, 234.7, 'wrong instantaneous voltage l3');
    });

    it('the instantaneous produced power should have been determined', function () {
      assert.strictEqual(result.electricity.instantaneousProducedPowerL1, 0, 'wrong instantaneous produced power l1');
      assert.strictEqual(result.electricity.instantaneousProducedPowerL2, 0, 'wrong instantaneous produced power l2');
      assert.strictEqual(result.electricity.instantaneousProducedPowerL3, 0, 'wrong instantaneous produced power l3');
    });

    it('the instantaneous consumed power should have been determined', function () {
      assert.strictEqual(result.electricity.instantaneousConsumedPowerL1, 0, 'wrong instantaneous consumed power l1');
      assert.strictEqual(result.electricity.instantaneousConsumedPowerL2, 0, 'wrong instantaneous consumed power l2');
      assert.strictEqual(result.electricity.instantaneousConsumedPowerL3, 0, 'wrong instantaneous consumed power l3');
    });
  });
});
