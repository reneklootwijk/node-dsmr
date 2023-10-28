/* eslint-disable spaced-comment */
'use strict';

const logger = require('winston');

// Add a transport as fall back when no parent logger has been initialized
// to prevent the error: "Attempt to write logs with no transports"
logger.add(new logger.transports.Console({
  level: 'none'
}));

const meterTypes = {
  2: { label: 'electricity', description: 'Electricity meter' },
  3: { label: 'gas', description: 'Gas meter' },
  7: { label: 'water', description: 'Water meter' }
};

function calcTimestamp (timeString) {
  return new Date(2000 + parseInt(timeString.substr(0, 2), 10),
    parseInt(timeString.substr(2, 2), 10) - 1,
    parseInt(timeString.substr(4, 2), 10),
    parseInt(timeString.substr(6, 2), 10),
    parseInt(timeString.substr(8, 2), 10),
    parseInt(timeString.substr(10, 2), 10)).getTime() / 1000;
}

module.exports = telegram => {
  let duration;
  let fields;
  const output = { electricity: {}, gas: {}, water: {} };
  let timestamp;
  let values;
  const meterTypeMap = { 0: 2 };
  const equipmentIdMap = {};
  const consumptionMap = {};
  const valvePositionMap = {};

  for (let index = 0; index < telegram.length; index++) {
    if (/^\//.test(telegram[index])) {
      values = /^\/(.*)/.exec(telegram[index]);

      if (values) {
        output.meterModel = values[1];
      }
    }

    if (/^[^(]+\(/.test(telegram[index])) {
      switch (true) {
        // 1-3:0.2.8(n) Version information for P1 output (DSMR 4.x/5.x)
        case /^1-3:0.2.8/.test(telegram[index]):
          values = /^1-3:0.2.8\((\d+)\)/.exec(telegram[index]);
          if (values) {
            output.dsmrVersion = parseInt(values[1], 10) / 10;
          }
          break;

        // 0-0:96.1.4(n) Version information for P1 output (eMUCS 1.7.1)
        case /^0-0:96.1.4/.test(telegram[index]):
          values = /^0-0:96.1.4\((\d+)\)/.exec(telegram[index]);
          if (values) {
            output.dsmrVersion = parseInt(values[1], 10) / 10000;
          }
          break;

        // 0-0:1.0.0(YYMMDDhhmmssX) Date-time stamp of the P1 message (X=S Summer time, X=W Winter time) (DSMR 4.x/5.x, eMUCs 1.7.1)
        case /^0-0:1.0.0/.test(telegram[index]):
          values = /^0-0:1.0.0\(([^)]+)\)/.exec(telegram[index]);
          if (values) {
            output.timestamp = calcTimestamp(values[1]);
          }
          break;

        // 0-n:24.1.0(n) Device-Type (DSMR 3.0/4.x./5.x/eMUCs)
        case /^0-\d{1}:24.1.0/.test(telegram[index]):
          values = /^0-(\d{1}):24.1.0\((\d+)\)/.exec(telegram[index]);

          if (values) {
            if (!output.connectedMeters) output.connectedMeters = [];

            if (meterTypes[parseInt(values[2], 16)]) {
              // Create mapping to be used at the end to map the equipment id on the right type of meter
              meterTypeMap[values[1]] = parseInt(values[2], 16);

              output.connectedMeters.push({
                mbusId: values[1],
                type: parseInt(values[2], 16),
                description: meterTypes[parseInt(values[2], 16)].description
              });
            } else {
              output.connectedMeters.push({
                mbusId: values[0],
                type: values[2],
                description: 'unknown'
              });
            }
          }
          break;

        // 0-n:96.1.0(n) Equipment identifier Gas / Water (DSMR 3.0/4.x/5.x)
        // 0-0:96.1.1(n) Equipment identifier Electricity (DSMR 3.0/4.x/5.x, eMUCs 1.7.1)
        // 0-n:96.1.1(n) Equipment identifier Gas / Water (eMUCs 1.7.1)
        // When the whole telegram has been processed this will be mapped on the right meter type
        case /^0-\d{1}:96.1.[0|1]/.test(telegram[index]):
          values = /^0-(\d{1}):96.1.[0|1]\((.*)\)/.exec(telegram[index]);
          if (values) {
            equipmentIdMap[values[1]] = Buffer.from(values[2], 'hex').toString();
          }
          break;

        // 0-n:24.2.1(YYMMDDhhmmssX)(n*m3) Consumed water / gas over the last hour in m3 (DSMR 4.x)
        // 0-n:24.2.1(YYMMDDhhmmssX)(n*m3) Consumed water / gas over the last 5 minutes in m3 (DSMR 5.x)
        // When the whole telegram has been processed this will be mapped on the right meter type and
        // the reported period will be added
        case /^0-\d{1}:24.2.1/.test(telegram[index]):
          values = /0-(\d{1}):24.2.1\((.*)\)\((.*)\)/.exec(telegram[index]);

          if (values) {
            consumptionMap[values[1]] = {
              timestamp: calcTimestamp(values[2]),
              totalConsumed: parseFloat(values[3])
            };
          }
          break;

        // 0-n:24.4.0(n) Valve position gas (on/off/released) (DSMR 3.0/4.x, eMUCs 1.7.1)
        // 0-n:24.4.0(n) Valve position water (on/off/released) (eMUCs 1.7.1)
        // When the whole telegram has been processed this will be mapped on the right meter type
        case /^0-\d{1}:24.4.0/.test(telegram[index]):
          values = /^0-(\d{1}):24.4.0\((.*)\)/.exec(telegram[index]);
          if (values) {
            valvePositionMap[values[1]] = parseInt(values[2], 10);
          }
          break;

        ////////////////////////////
        // ELECTRICITY OBIS CODES //
        ////////////////////////////
        //
        // 1-0:1.8.1(n*kWh) Total power consumed (tariff 1), accuracy: 0.001kWh (3.0/4.x/5.x)
        case /^1-0:1.8.1/.test(telegram[index]):
          values = /^1-0:1.8.1\((.*)\*kWh\)/.exec(telegram[index]);
          if (values) {
            output.electricity.totalConsumed1 = parseFloat(values[1]);
          }
          break;

        // 1-0:1.8.2(n*kWh) Total power consumed (tariff 2), accuracy: 0.001kWh (3.0/4.x/5.x)
        case /^1-0:1.8.2/.test(telegram[index]):
          values = /^1-0:1.8.2\((.*)\*kWh\)/.exec(telegram[index]);
          if (values) {
            output.electricity.totalConsumed2 = parseFloat(values[1]);
          }
          break;

        // 1-0:2.8.1(n*kWh) Total power produced (tariff 1), accuracy: 0.001kWh (3.0/4.x/5.x)
        case /^1-0:2.8.1/.test(telegram[index]):
          values = /^1-0:2.8.1\((.*)\*kWh\)/.exec(telegram[index]);
          if (values) {
            output.electricity.totalProduced1 = parseFloat(values[1]);
          }
          break;

        // 1-0:2.8.2(n*kWh) Total power produced (tariff 2), accuracy: 0.001kWh (3.0/4.x/5.x)
        case /^1-0:2.8.2/.test(telegram[index]):
          values = /^1-0:2.8.2\((.*)\*kWh\)/.exec(telegram[index]);
          if (values) {
            output.electricity.totalProduced2 = parseFloat(values[1]);
          }
          break;

        // 0-0:96.14.0 Electricity tariff indicator (3.0/4.x/5.x)
        case /^0-0:96.14.0/.test(telegram[index]):
          values = /^0-0:96.14.0\((.*)\)/.exec(telegram[index]);
          if (values) {
            output.electricity.activeTariff = parseInt(values[1], 10);
          }
          break;

        // 1-0:1.7.0(n*kW) Actual power consumed, resolution: 1 Watt (3.0/4.x/5.x)
        case /^1-0:1.7.0/.test(telegram[index]):
          values = /^1-0:1.7.0\((.*)\*kW\)/.exec(telegram[index]);
          if (values) {
            output.electricity.actualConsumed = parseFloat(values[1]);
          }
          break;

        // 1-0:2.7.0(n*kW) Actual power produced (-P), resolution: 1 Watt (DSMR 3.0/4.x/5.x)
        case /^1-0:2.7.0/.test(telegram[index]):
          values = /^1-0:2.7.0\((.*)\*kW\)/.exec(telegram[index]);
          if (values) {
            output.electricity.actualProduced = parseFloat(values[1]);
          }
          break;

        // 0-0:96.7.21(n) Number of power failures in any phase (DSMR 4.x/5.x)
        case /^0-0:96.7.21/.test(telegram[index]):
          values = /^0-0:96.7.21\((.*)\)/.exec(telegram[index]);
          if (values) {
            output.electricity.failures = parseInt(values[1], 10);
          }
          break;

        // 0-0:17.0.0(n*A) The actual threshold Electricity in A (3.0)
        // 0-0:17.0.0(n*kW) The actual threshold Electricity in kW (DSMR 4.x, eMUCs 1.7.1)
        case /^0-0:17.0.0/.test(telegram[index]):
          values = /^0-0:17.0.0\(([^)]+)\*([^)]+)\)/.exec(telegram[index]);
          if (values) {
            if (values[2] === 'A') {
              output.electricity.thresholdA = parseFloat(values[1]);
            } else {
              output.electricity.thresholdkW = parseFloat(values[1]);
            }
          }
          break;

        // 0-0:96.3.10(n) Actual switch position Electricity (in/out/enabled) (DSMR 3.0/4.x, eMUCs 1.7.1)
        case /^0-0:96.3.10/.test(telegram[index]):
          values = /^0-0:96.3.10\((.*)\)/.exec(telegram[index]);
          if (values) {
            output.electricity.switchPosition = parseInt(values[1], 10);
          }
          break;

        // 0-0:96.7.9(n) Number of long power failures in any phase (DSMR 4.x/5.x)
        case /^0-0:96.7.9/.test(telegram[index]):
          values = /^0-0:96.7.9\((.*)\)/.exec(telegram[index]);
          if (values) {
            output.electricity.failuresLong = parseInt(values[1], 10);
          }
          break;

        // 1-0:99.97.0(n)(0:96.7.19)(YYMMDDhhssX)(n*s)(YYMMDDhhssX)(n*s) Power Failure Event Log (DSMR 4.x/5.x)
        // 1-0:99.97.0(n)(0-0:96.7.19)(YYMMDDhhssX)(n*s)(YYMMDDhhssX)(n*s) Power Failure Event Log (DSMR 4.x/5.x)
        case /^1-0:99.97.0/.test(telegram[index]):
          values = /^1-0:99.97.0\((\d+)\)\(0?-?0:96.7.19\)\((.*)\)/.exec(telegram[index]);

          if (values) {
            output.electricity.failureLog = [];

            fields = values[2].split(')(');

            for (let field = 0; field < fields.length; field++) {
              timestamp = calcTimestamp(fields[field]);

              values = /^(.*)\*s/.exec(fields[++field]);
              if (values) {
                duration = parseInt(values[1], 10);
              }

              output.electricity.failureLog.push({
                timestampEnd: timestamp,
                duration: duration
              });
            }
          }
          break;

        // 1-0:32.32.0(n) Number of voltage sags in phase L1 (DSMR 4.x/5.x)
        case /^1-0:32.32.0/.test(telegram[index]):
          values = /^1-0:32.32.0\((.*)/.exec(telegram[index]);
          if (values) {
            output.electricity.voltageSagsL1 = parseInt(values[1], 10);
          }
          break;

        // 1-0:52.32.0(n) Number of voltage sags in phase L2 (DSMR 4.x/5.x)
        case /^1-0:52.32.0/.test(telegram[index]):
          values = /^1-0:52.32.0\((.*)/.exec(telegram[index]);
          if (values) {
            output.electricity.voltageSagsL2 = parseInt(values[1], 10);
          }
          break;

        // 1-0:72.32.0(n) Number of voltage sags in phase L3 (DSMR 4.x/5.x)
        case /^1-0:72.32.0/.test(telegram[index]):
          values = /^1-0:72.32.0\((.*)/.exec(telegram[index]);
          if (values) {
            output.electricity.voltageSagsL3 = parseInt(values[1], 10);
          }
          break;

        // 1-0:32.36.0(n) Number of voltage swells in phase L1 (DSMR 4.x/5.x)
        case /^1-0:32.36.0/.test(telegram[index]):
          values = /^1-0:32.36.0\((.*)/.exec(telegram[index]);
          if (values) {
            output.electricity.voltageSwellsL1 = parseInt(values[1], 10);
          }
          break;

        // 1-0:52.36.0(n) Number of voltage swells in phase L2 (DSMR 4.x/5.x)
        case /^1-0:52.36.0/.test(telegram[index]):
          values = /^1-0:52.36.0\((.*)/.exec(telegram[index]);
          if (values) {
            output.electricity.voltageSwellsL2 = parseInt(values[1], 10);
          }
          break;

        // 1-0:72.36.0(n) Number of voltage swells in phase L3 (DSMR 4.x/5.x)
        case /^1-0:72.36.0/.test(telegram[index]):
          values = /^1-0:72.36.0\((.*)/.exec(telegram[index]);
          if (values) {
            output.electricity.voltageSwellsL3 = parseInt(values[1], 10);
          }
          break;

        // 1-0:32.7.0(n*V) Instantaneous voltage L1 in V (DSMR 4.x/5.x)
        case /^1-0:32.7.0/.test(telegram[index]):
          values = /^1-0:32.7.0\((.*\*V)/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousVoltageL1 = parseFloat(values[1]);
          }
          break;

        // 1-0:52.7.0(n*V) Instantaneous voltage L2 in V (DSMR 4.x/5.x)
        case /^1-0:52.7.0/.test(telegram[index]):
          values = /^1-0:52.7.0\((.*)\*V/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousVoltageL2 = parseFloat(values[1]);
          }
          break;

        // 1-0:72.7.0(n*V) Instantaneous voltage L3 in V (DSMR 4.x/5.x)
        case /^1-0:72.7.0/.test(telegram[index]):
          values = /^1-0:72.7.0\((.*)\*V/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousVoltageL3 = parseFloat(values[1]);
          }
          break;

        // 1-0:31.7.0(n*A) Instantaneous current L1 in A (DSMR 4.x/5.x, eMUCs 1.7.1)
        case /^1-0:31.7.0/.test(telegram[index]):
          values = /^1-0:31.7.0\((.*)\*A/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousCurrentL1 = parseFloat(values[1]);
          }
          break;

        // 1-0:51.7.0(n*A) Instantaneous current L2 in A (DSMR 4.x/5.x, eMUCs 1.7.1)
        case /^1-0:51.7.0/.test(telegram[index]):
          values = /^1-0:51.7.0\((.*)\*A/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousCurrentL2 = parseFloat(values[1]);
          }
          break;

        // 1-0:71.7.0(n*A) Instantaneous current L3 in A (DSMR 4.x/5.x, eMUCs 1.7.1)
        case /^1-0:71.7.0/.test(telegram[index]):
          values = /^1-0:71.7.0\((.*)\*A/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousCurrentL3 = parseFloat(values[1]);
          }
          break;

        // 1-0:21.7.0(n*kW) Instantaneous active power L1 (+P) in kW (DSMR 4.x/5.x)
        case /^1-0:21.7.0/.test(telegram[index]):
          values = /^1-0:21.7.0\((.*)\*kW\)/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousConsumedPowerL1 = parseFloat(values[1]);
          }
          break;

        // 1-0:22.7.0(n*kW) Instantaneous active power L1 (-P) in kW (DSMR 4.x/5.x)
        case /^1-0:22.7.0/.test(telegram[index]):
          values = /^1-0:22.7.0\((.*)\*kW\)/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousProducedPowerL1 = parseFloat(values[1]);
          }
          break;

        // 1-0:41.7.0(n*kW) Instantaneous active power L2 (+P) in kW (DSMR 4.x/5.x)
        case /^1-0:41.7.0/.test(telegram[index]):
          values = /^1-0:41.7.0\((.*)\*kW\)/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousConsumedPowerL2 = parseFloat(values[1]);
          }
          break;

        // 1-0:42.7.0(n*kW) Instantaneous active power L2 (-P) in kW (DSMR 4.x/5.x)
        case /^1-0:42.7.0/.test(telegram[index]):
          values = /^1-0:42.7.0\((.*)\*kW\)/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousProducedPowerL2 = parseFloat(values[1]);
          }
          break;

        // 1-0:61.7.0(n*kW) Instantaneous active power L3 (+P) in kW (DSMR 4.x/5.x)
        case /^1-0:61.7.0/.test(telegram[index]):
          values = /^1-0:61.7.0\((.*)\*kW\)/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousConsumedPowerL3 = parseFloat(values[1]);
          }
          break;

        // 1-0:62.7.0(n*kW) Instantaneous active power L3 (-P) in kW (DSMR 4.x/5.x)
        case /^1-0:62.7.0/.test(telegram[index]):
          values = /^1-0:62.7.0\((.*)\*kW\)/.exec(telegram[index]);
          if (values) {
            output.electricity.instantaneousProducedPowerL3 = parseFloat(values[1]);
          }
          break;

        // 1-0:1.4.0(n*kW) Active energy import (avg. demand) (eMUCs 1.7.1)
        case /^1-0:1.4.0/.test(telegram[index]):
          values = /^1-0:1.4.0\(([^*]+)\*kW\)/.exec(telegram[index]);
          if (values) {
            if (!output.electricity.capacity) {
              output.electricity.capacity = {
                import: {}
              };
            }

            output.electricity.capacity.import = { avgDemand: parseFloat(values[1]) };
          }
          break;

        // 1-0:1.6.0(YYMMDDhhmmssX)(n*kW) Active energy import of the running month (max. demand) (eMUCs 1.7.1)
        case /^1-0:1.6.0/.test(telegram[index]):
          values = /^1-0:1.6.0\((.*)\)\((.*)\*kW\)/.exec(telegram[index]);

          if (values) {
            if (!output.electricity.capacity) {
              output.electricity.capacity = {
                import: {}
              };
            }

            output.electricity.capacity.import.runningMonth = {
              maxDemand: parseFloat(values[2]),
              timestamp: calcTimestamp(values[1])
            };
          }
          break;

        // 0-0:98.1.0(n)(1-0:1.6.0)(1-0:1.6.0)[(YYMMDDhhmmssX)(YYMMDDhhmmssX)(n*kW))] Active energy import of the last 13 months (max. demand) (eMUCs 1.7.1)
        case /^0-0:98.1.0/.test(telegram[index]):
          // Determine number of reported months
          values = /^0-0:98.1.0\((\d+)\)\(1-0:1\.6\.0\)\(1-0:1\.6\.0\)(.*)/.exec(telegram[index]);

          if (values) {
            if (!output.electricity.capacity) {
              output.electricity.capacity = {
                import: {}
              };
            }

            const fields = values[2].replace(/^\(|\)$/g, '').split(/\)\(/g);

            output.electricity.capacity.import.history = [];

            for (let index = 0; index < values[1] * 3; index += 3) {
              output.electricity.capacity.import.history.push({
                start: calcTimestamp(fields[index + 1]),
                end: calcTimestamp(fields[index]),
                maxDemand: parseFloat(fields[index + 2])
              });
            }
          }
          break;

        ////////////////////
        // GAS OBIS CODES //
        ////////////////////
        //
        // 24.3.0(YYMMDDhhmmss)(00)(60)(1)(0-2:24.2.1)(m3) Consumed gas over the last hour in m3 (DSMR 3.0)
        case /^0-\d{1}:24.3.0/.test(telegram[index]):
          // Calculate timestamp
          values = /^\d+-\d+:[^(]+\(([^)]+)\)/.exec(telegram[index]);
          if (values) {
            output.gas.timestamp = calcTimestamp(values[[1]]);
          }

          // Get usage value from next line
          values = /^\(([^)]+)/.exec(telegram[index + 1]);
          if (values) {
            output.gas.totalConsumed = parseFloat(values[1]);
            output.gas.reportedPeriod = 60;
          }
          break;

        // 0-n:24.2.3(YYMMDDhhmmssX)(n*m3) Last value of ‘not temperature corrected’ gas volume in m3 (eMUCs 1.7.1)
        case /^0-\d{1}:24.2.3/.test(telegram[index]):
          values = /^0-\d+:24.2.3\((.*)\)\((.*)\*m3\)/.exec(telegram[index]);

          if (values) {
            output.gas = {
              timestamp: calcTimestamp(values[1]),
              totalConsumed: parseFloat(values[2])
            };
          }
          break;

        /////////////////////////
        // MESSAGES OBIS CODES //
        /////////////////////////
        //
        // 0-0:96.13.1(n) Text message codes: numeric 8 digits (DSMR 3.0/4.x/5.x, eMUCs 1.7.1)
        case /^0-0:96.13.1/.test(telegram[index]):
          values = /^0-0:96.13.1\((.*)\)/.exec(telegram[index]);

          if (values) {
            if (!output.messages) output.messages = {};

            output.messages.code = Buffer.from(values[1], 'hex').toString();
          }
          break;

        // 0-0:96.13.0(s) Text message max 1024 characters (DSMR 3.0/4.x/5.x)
        case /^0-0:96.13.0/.test(telegram[index]):
          values = /^0-0:96.13.0\((.*)\)/.exec(telegram[index]);

          if (values) {
            if (!output.messages) output.messages = {};

            output.messages.text = Buffer.from(values[1], 'hex').toString();
          }
          break;

        default:
          logger.debug('Unknown id: ' + telegram[index]);
      }
    }
  }

  // Map equipment Id on the right meter type
  for (const mbusId in equipmentIdMap) {
    if (meterTypeMap[mbusId] && meterTypes[meterTypeMap[mbusId]]) {
      output[meterTypes[meterTypeMap[mbusId]].label].equipmentId = equipmentIdMap[mbusId];
    }
  }

  // Map valvePosition on the right meter type
  for (const mbusId in valvePositionMap) {
    if (meterTypeMap[mbusId] && meterTypes[meterTypeMap[mbusId]]) {
      output[meterTypes[meterTypeMap[mbusId]].label].valvePosition = valvePositionMap[mbusId];
    }
  }

  // Map hourly consumption on the right meter
  for (const mbusId in consumptionMap) {
    if (!output[meterTypes[meterTypeMap[mbusId]].label]) output[meterTypes[meterTypeMap[mbusId]].label] = {};

    if (meterTypeMap[mbusId] && meterTypes[meterTypeMap[mbusId]]) {
      if (output.dsmrVersion < 5) {
        consumptionMap[mbusId].reportedPeriod = 60;
      }

      if (output.dsmrVersion >= 5) {
        consumptionMap[mbusId].reportedPeriod = 5;
      }

      output[meterTypes[meterTypeMap[mbusId]].label] = { ...output[meterTypes[meterTypeMap[mbusId]].label], ...consumptionMap[mbusId] };
    }
  }

  return output;
};
