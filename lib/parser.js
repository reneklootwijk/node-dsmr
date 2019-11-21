/* eslint-disable spaced-comment */
'use strict'

const logger = require('winston')

// Add a transport as fall back when no parent logger has been initialized
// to prevent the error: "Attempt to write logs with no transports"
logger.add(new logger.transports.Console({
  level: 'none'
}))

module.exports = telegram => {
  var duration
  var events
  var fields
  var output = { power: {}, gas: {} }
  var timestamp
  var values

  for (let index = 0; index < telegram.length; index++) {
    if (/^\//.test(telegram[index])) {
      output.meterModel = /^\/(.*)/.exec(telegram[index])[1]
    }

    if (/^[^(]+\(/.test(telegram[index])) {
      switch (true) {
        // 1-3:0.2.8(n) Version information for P1 output (DSMR 4.x/5.x)
        case /1-3:0.2.8/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((\d+)\)/.exec(telegram[index])
          if (values) {
            output.dsmrVersion = parseInt(values[1], 10) / 10
          }
          continue

        // 0-0:1.0.0(YYMMDDhhmmssX) Date-time stamp of the P1 message (X=S Summer time, X=W Winter time) (DSMR 4.x)
        case /0-0:1.0.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\(([^)]+)\)/.exec(telegram[index])
          if (values) {
            output.power.timestamp = new Date(2000 + parseInt(values[1].substr(0, 2), 10),
              parseInt(values[1].substr(2, 2), 10) - 1,
              parseInt(values[1].substr(4, 2), 10),
              parseInt(values[1].substr(6, 2), 10),
              parseInt(values[1].substr(8, 2), 10),
              parseInt(values[1].substr(10, 2), 10)).getTime() / 1000
          }
          continue

        ////////////////////////////
        // ELECTRICITY OBIS CODES //
        ////////////////////////////
        //
        // 1-0:1.8.1(n*kWh) Total power consumed (tariff 1), accuracy: 0.001kWh (DSMR 2.1/2.2/2.3/3.0/4.x)
        case /1-0:1.8.1/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kWh\)/.exec(telegram[index])
          if (values) {
            output.power.totalConsumed1 = parseFloat(values[1])
          }
          continue

        // 1-0:1.8.2(n*kWh) Total power consumed (tariff 2), accuracy: 0.001kWh (DSMR 2.1/2.2/2.3/3.0/4.x)
        case /1-0:1.8.2/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kWh\)/.exec(telegram[index])
          if (values) {
            output.power.totalConsumed2 = parseFloat(values[1])
          }
          continue

        // 1-0:2.8.1(n*kWh) Total power produced (tariff 1), accuracy: 0.001kWh (DSMR 2.1/2.2/2.3/3.0/4.x)
        case /1-0:2.8.1/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kWh\)/.exec(telegram[index])
          if (values) {
            output.power.totalProduced1 = parseFloat(values[1])
          }
          continue

        // 1-0:2.8.2(n*kWh) Total power produced (tariff 2), accuracy: 0.001kWh (DSMR 2.1/2.2/2.3/3.0/4.x)
        case /1-0:2.8.2/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kWh\)/.exec(telegram[index])
          if (values) {
            output.power.totalProduced2 = parseFloat(values[1])
          }
          continue

        // 1-0:1.7.0(n*kW) Actual power consumed, resolution: 1 Watt (DSMR 2.1/2.2/2.3/3.0/4.x)
        case /1-0:1.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kW\)/.exec(telegram[index])
          if (values) {
            output.power.actualConsumed = parseFloat(values[1])
          }
          continue

        // 1-0:2.7.0(n*kW) Actual power produced (-P), resolution: 1 Watt (DSMR 3.0/4.x)
        case /1-0:2.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kW\)/.exec(telegram[index])
          if (values[1]) {
            output.power.actualProduced = parseFloat(values[1])
          }
          continue

        // 0-0:17.0.0(n*A) The actual threshold Electricity in A (DSMR 2.2/2.3/3.0)
        // 0-0:17.0.0(n*kW) The actual threshold Electricity in kW (DSMR 4.x)
        case /0-0:17.0.0/.test(telegram[index]):
          continue

        // 0-0:96.14.0 Electricity tariff indicator (DSMR 2.1/2.2/2.3/3.0/4.x1)
        case /0-0:96.14.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\)/.exec(telegram[index])
          if (values) {
            output.power.activeTariff = parseInt(values[1], 10)
          }
          continue

        // 1-0:99.97.0(2)(0-0:96.7.19)(YYMMDDhhssX)(n*s)(YYMMDDhhssX)(n*s) Power Failure Event Log (DSMR 4.x)
        case /1-0:99.97.0/.test(telegram[index]):
          output.power.failureLog = []

          // Determine number of reported events
          values = /^\d+-\d+:[^(]+\((.*)\)/.exec(telegram[index])
          if (values) {
            events = parseInt(values[1], 10)
          }

          events = /^\d+-\d+:[^(]+\([^)]+\)\([^)]+\)\((.*)\)/.exec(telegram[index])

          if (events) {
            fields = events[1].split(')(')

            for (let field = 0; field < fields.length; field++) {
              timestamp = new Date(2000 + parseInt(fields[field].substr(0, 2), 10),
                parseInt(fields[field].substr(2, 2), 10) - 1,
                parseInt(fields[field].substr(4, 2), 10),
                parseInt(fields[field].substr(6, 2), 10),
                parseInt(fields[field].substr(8, 2), 10),
                parseInt(fields[field].substr(10, 2), 10)).getTime() / 1000

              values = /^(.*)\*s/.exec(fields[++field])
              if (values) {
                duration = parseInt(values[1], 10)
              }

              output.power.failureLog.push({
                timestampEnd: timestamp,
                duration: duration
              })
            }
          }
          continue

        // 1-0:32.32.0(n) Number of voltage sags in phase L1 (DSMR 4.x)
        case /1-0:32.32.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.voltageSagsL1 = parseInt(values[1], 10)
          }
          continue

        // 1-0:32.36.0(n) Number of voltage swells in phase L1 (DSMR 4.x)
        case /1-0:32.36.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.voltageSwellsL1 = parseInt(values[1], 10)
          }
          continue

        // 1-0:52.32.0(n) Number of voltage sags in phase L2 (polyphase meters only) (DSMR 4.x)
        case /1-0:52.32.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.voltageSagsL2 = parseInt(values[1], 10)
          }
          continue

        // 1-0:52.36.0(00000) Number of voltage swells in phase L2 (polyphase meters only) (DSMR 4.x)
        case /1-0:52.36.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.voltageSwellsL2 = parseInt(values[1], 10)
          }
          continue

        // 1-0:72.32.0(00000) Number of voltage sags in phase L3 (polyphase meters only) (DSMR 4.x)
        case /1-0:72.32.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.voltageSagsL3 = parseInt(values[1], 10)
          }
          continue

        // 1-0:72.36.0(00000) Number of voltage swells in phase L3 (polyphase meters only) (DSMR 4.x)
        case /1-0:72.36.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.voltageSwellsL3 = parseInt(values[1], 10)
          }
          continue

        // 1-0:32.7.0(n*V) Instantaneous voltage L1 in V (DSMR 4.x)
        case /1-0:32.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousVoltageL1 = parseFloat(values[1])
          }
          continue

        // 1-0:52.7.0(n*V) Instantaneous voltage L2 in V (DSMR 4.x)
        case /1-0:52.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousVoltageL2 = parseFloat(values[1])
          }
          continue

        // 1-0:72.7.0(n*V) Instantaneous voltage L3 in V (DSMR 4.x)
        case /1-0:72.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousVoltageL3 = parseFloat(values[1])
          }
          continue

        // 1-0:31.7.0(n*A) Instantaneous current L1 in A (DSMR 4.x)
        case /1-0:31.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousCurrentL1 = parseFloat(values[1])
          }
          continue

        // 1-0:51.7.0(n*A) Instantaneous current L2 in A (DSMR 4.x)
        case /1-0:51.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousCurrentL2 = parseFloat(values[1])
          }
          continue

        // 1-0:71.7.0(n*A) Instantaneous current L3 in A (DSMR 4.x)
        case /1-0:71.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousCurrentL3 = parseFloat(values[1])
          }
          continue

        // 1-0:21.7.0(n*kW) Instantaneous active power L1 (+P) in kW (DSMR 4.x)
        case /1-0:21.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kW\)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousProducedElectricityL1 = parseFloat(values[1])
          }
          continue

        // 1-0:22.7.0(n*kW) Instantaneous active power L1 (-P) in kW (DSMR 4.x)
        case /1-0:22.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kW\)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousConsumedElectricityL1 = parseFloat(values[1])
          }
          continue

        // 1-0:41.7.0(n*kW) Instantaneous active power L2 (+P) in kW (DSMR 4.x)
        case /1-0:41.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kW\)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousProducedElectricityL2 = parseFloat(values[1])
          }
          continue

        // 1-0:42.7.0(n*kW) Instantaneous active power L2 (-P) in kW (DSMR 4.x)
        case /1-0:42.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kW\)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousConsumedElectricityL2 = parseFloat(values[1])
          }
          continue

        // 1-0:61.7.0(n*kW) Instantaneous active power L3 (+P) in kW (DSMR 4.x)
        case /1-0:61.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kW\)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousProducedElectricityL3 = parseFloat(values[1])
          }
          continue

        // 1-0:62.7.0(n*kW) Instantaneous active power L3 (-P) in kW (DSMR 4.x)
        case /1-0:62.7.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\*kW\)/.exec(telegram[index])
          if (values) {
            output.power.instantaneousConsumedElectricityL3 = parseFloat(values[1])
          }
          continue

        // 0-0:42.0.0(n) Equipment identifier power (DSMR 2.1/2.2/2.3)
        // 0-0:96.1.1(n) Equipment identifier Electricity (DSMR 3.0/4.x)
        case /0-0:42.0.0/.test(telegram[index]):
        case /0-0:96.1.1/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\)/.exec(telegram[index])
          if (values) {
            output.power.equipmentId = Buffer.from(values[1], 'hex').toString()
          }
          continue

        // 0-0:96.7.9(n) Number of long power failures in any phase (DSMR 4.x/5.0)
        case /0-0:96.7.9/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\)/.exec(telegram[index])
          if (values) {
            output.power.failuresLong = parseInt(values[1], 10)
          }
          continue

        // 0-0:96.7.21(n) Number of power failures in any phases (DSMR 4.x/5.0)
        case /0-0:96.7.21/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\)/.exec(telegram[index])
          if (values) {
            output.power.failures = parseInt(values[1], 10)
          }
          continue

        // 1-0:96.3.10(n) Actual switch position Electricity (in/out) (DSMR 2.1)
        // 0-0:24.4.0(n) Actual switch position Electricity (in/off) (DSMR 2.2/2.3)
        // 0-0:96.3.10(n) Actual switch position Electricity (in/out/enabled) (DSMR 3.0/4.x)
        case /1-0:96.3.10/.test(telegram[index]):
        case /0-0:24.4.0/.test(telegram[index]):
        case /0-0:96.3.10/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\)/.exec(telegram[index])
          if (values) {
            output.power.switchPosition = parseInt(values[1], 10)
          }
          continue

        ////////////////////
        // GAS OBIS CODES //
        ////////////////////
        //
        // 0-n:24.1.0(n) Device-Type (DSMR 3.0/4.x)
        case /0-[1-9]+:24.1.0/.test(telegram[index]):
          continue

          // 24.3.0(YYMMDDhhmmss)(00)(60)(1)(0-2:24.2.1)(m3) Total gas consumed, the value is on the next row (DSMR 3.0)
        case /0-[1-9]+:24.3.0/.test(telegram[index]):
          values = /^\(([^)]+)/.exec(telegram[index + 1])
          if (values) {
            output.gas.totalConsumed = parseFloat(values[1])
          }

          values = /^\d+-\d+:[^(]+\(([^)]+)\)/.exec(telegram[index])
          if (values) {
            output.gas.timestamp = new Date(2000 + parseInt(values[1].substr(0, 2), 10),
              parseInt(values[1].substr(2, 2), 10) - 1,
              parseInt(values[1].substr(4, 2), 10),
              parseInt(values[1].substr(6, 2), 10),
              parseInt(values[1].substr(8, 2), 10),
              parseInt(values[1].substr(10, 2), 10)).getTime() / 1000
          }

          continue

        // 7-0:0.0.0(n)  Equipment identifier (gas meter) (DSMR 2.1/2.2/2.3)
        // 0-n:96.1.0(n) Equipment identifier (gas meter) (DSMR 3.0/4.x)
        case /7-0:0.0.0/.test(telegram[index]):
        case /0-[1-9]+:96.1.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\)/.exec(telegram[index])
          if (values) {
            output.gas.equipmentId = Buffer.from(values[1], 'hex').toString()
          }
          continue

        // 7-0:23.1.0(YYMMhhmmss)(n) Consumed gas over the last 24 hours (DSMR 2.1/2.2/2.3)
        // 0-n:24.2.1(YYMMDDhhmmssX)(n*m3) Total gas consumed (DSMR 4.x)
        case /7-0:23.1.0/.test(telegram[index]):
        case /0-[1-9]+:24.2.1/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\)\((.*)\)/.exec(telegram[index])
          if (values) {
            output.gas.timestamp = new Date(2000 + parseInt(values[1].substr(0, 2), 10),
              parseInt(values[1].substr(2, 2), 10) - 1,
              parseInt(values[1].substr(4, 2), 10),
              parseInt(values[1].substr(6, 2), 10),
              parseInt(values[1].substr(8, 2), 10),
              parseInt(values[1].substr(10, 2), 10)).getTime() / 1000

            output.gas.totalConsumed = parseFloat(values[2])
          }
          continue

        // 7-0:23.2.0(YYMMhhmmss)(n) Consumed gas, temperature compensated, over the last 24 hours (DSMR 2.1/2.2/2.3)
        case /7-0:23.2.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\)\((.*)\)/.exec(telegram[index])
          if (values) {
            output.gas.timestamp = new Date(2000 + parseInt(values[1].substr(0, 2), 10),
              parseInt(values[1].substr(2, 2), 10) - 1,
              parseInt(values[1].substr(4, 2), 10),
              parseInt(values[1].substr(6, 2), 10),
              parseInt(values[1].substr(8, 2), 10),
              parseInt(values[1].substr(10, 2), 10)).getTime() / 1000
            output.gas.totalConsumed = parseFloat(values[2])
          }
          continue

        // 7-0:96.3.10(n) Valve position gas (on/off/released) (DSMR 2.1)
        // 7-0:24.4.0(n) Valve position gas (on/off/released) (DSMR 2.2/2.3)
        // 0-n:24.4.0(n)  Valve position gas (on/off/released) (DSMR 3.0/4.x)
        case /7-0:96.3.10/.test(telegram[index]):
        case /7-0:24.4.0/.test(telegram[index]):
        case /0-[1-9]+:24.4.0/.test(telegram[index]):
          values = /^\d+-\d+:[^(]+\((.*)\)/.exec(telegram[index])
          if (values) {
            output.gas.valvePosition = parseInt(values[1], 10)
          }
          continue

        /////////////////////////
        // MESSAGES OBIS CODES //
        /////////////////////////
        //
        // 0-0:96.13.0(s) Text message max 1024 characters (DSMR 2.1/2.2/2.3/3.0/4.x)
        case /0-0:96.13.0/.test(telegram[index]):
          continue

          // 0-0:96.13.1(n) Text message codes: numeric 8 digits (DSMR 2.1/2.2/2.3/3.0/4.x)
        case /0-0:96.13.1/.test(telegram[index]):
          continue

        default:
          logger.debug('Unknown id: ' + telegram[index])
      }
    }
  }

  return output
}
