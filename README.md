# DSMR (Dutch Smart Meter Requirements) Parser

[![Build](https://github.com/reneklootwijk/node-dsmr/workflows/build/badge.svg)](https://github.com/reneklootwijk/node-dsmr/actions)
[![Coverage Status](https://coveralls.io/repos/github/reneklootwijk/node-dsmr/badge.svg?branch=master)](https://coveralls.io/github/reneklootwijk/node-dsmr?branch=master)
[![npm](https://img.shields.io/npm/v/node-dsmr)](https://www.npmjs.com/package/node-dsmr)

The parser supports telegrams compliant to DSMR version 3.x, 4.x and 5.x, and eMUCs version 1.7.1 (since version 2).

## Installation

```bash
npm install node-dsmr
```

## Breaking changes

Version 2.0.0 introduced the following breaking changes:

* Support for DSMR version 2.x has been dropped
* The *power* section has been renamed to *electricity*, e.g. *power.totalConsumed1* is now *electricity.totalConsumed1*
* The properties *instantaneousConsumedElectricityL1/L2/L3* and *instantaneousProducedElectricityL1/L2/L3* are renamed to *instantaneousConsumedPowerL1/L2/L3* and *instantaneousProducedPowerL1/L2/L3*

## API

```javascript
const SmartMeter = require('node-dsmr')

var options = {
    port: '/dev/ttyUSB0',
    baudrate: 9600,
    databits: 7,
    parity: 'even'
}

var smartmeter = new SmartMeter(options)
```

### SmartMeter

Instantiate a new SmartMeter object by specifying the characteristics of the P1 port.

```javascript
var smartMeter = new SmartMeter(options)
```

The arguments are:

* `port`, serial port to which the P1 port is connected
* `baudrate`, the rate at which the P1 port communicates, for DSMR 3.0 meters this is `9600` and for 4.x this is `115200`.
* `databits`, the number of bits used, for 3.0 meters this is `7` and for 4.x this is `8`.
* `parity`, the parity used, for 3.0 this is `even` and for 4.x this is `none`.
* `disableCrcChecking`, when set to `true` the CRC check is disabled. The default is to check the CRC specified in the telegram with the calculated CRC, when they do not match, the telegram is not processed. When no CRC is specified as part of the telegram (e.g. for a DSMR 3.x message), the check is bypassed.

### SmartMeter.connect

The connect method is used to connect and open the serial port.

```javascript
smartMeter.connect()
```

### Events

When an event happens, e.g. successful connection or a telegram has been received, the event will be emitted. By creating listeners for these events, the event can be processed in your code.

* `connected`, a successful connection to the serial port has been made.
* `telegram`, a new telegram has been received, the data of the event is the complete telegram as a JSON.

    Example:

    ```javascript
    {
        electricity: {
            equipmentId: 'K8EG004046395507',
            totalConsumed1: 12345.678,
            totalConsumed2: 12345.678,
            totalProduced1: 12345.678,
            totalProduced2: 12345.678,
            activeTariff: 2,
            actualConsumed: 1.19,
            actualProduced: 0,
            switchPosition: 1
        },
        gas: {
            equipmentId: '2222ABCD12345678A',
            totalConsumed: 0,
            consumedLastPeriod: 0,
            reportedPeriod: 5,
            timestamp: 1234450800,
            valvePosition: 1
        },
        meterModel: 'ISk5\\2MT382-1000'
    }
    ```

* `update`, a new telegram has been received with updated metrics, the data of the event contains the updated metrics as JSON. The electricity metrics presenting the actual consumption and/or production are continuously measured and for that reason always included in the update event, even when the actual value is the same as the previous measurement. The gas metrics presenting the total consumption is measured periodically as indicated with the included timestamp. When the timestamp indicates a new measurement has been performed the consumption since the last report is included even when 0. The total gas consumption is only reported when it has changed.

    Example:

    ```javascript
    {
        "electricity": {
            "totalConsumed1": 123456.789,
            "activeTariff": 1,
            "actualConsumed": 1.193,
            "actualProduced": 0
        },
        "gas": {
            "reportedPeriod": 5,
            "consumedLastPeriod": 0
        }
    }
     ```

### Reported metrics

The following metrics are reported when they are included in the telegram received from the P1 port:

| Category | Metric | OBIS reference | Description                                  |
|-|-|-|-|
| | meterModel | | |
| | dsmrVersion| 1-3:0.2.8<br/>0-0:96.1.4 | Version of the specification |
| | timestamp | 0-0:1.0.0 |timestamp of the telegram |
| | connectedMeters | | details of all connected meters (the electricity meter is always connected and not reported here) |
| **`electricity`** | equipmentId | 0-0:96.1.1 | |
| | totalConsumed1 | 1-0:1.8.1 | total consumption in tariff 1 in kWh |
| | totalConsumed2 | 1-0:1.8.2 | total consumption in tariff 2 in kWh |
| | totalProduced1 | 1-0:2.8.1 | total production in tariff 1 in kWh |
| | totalProduced2 | 1-0:2.8.2 | total production in tariff 2 in kWh |
| | actualConsumed | 1-0:1.7.0 | actual consumption in kW |
| | actualProduced | 1-0:2.7.0 | actual produced in kW |
| | actualTariff | 1-0:2.7.0 | active tariff |
| | failureLog | 1-0:99.97.0 | power failure event log (see below) |
| | failures | 0-0:96.7.21 | number of power failures |
| | failuresLong | 0-0:96.7.9 | number of long power failures |
| | voltageSagsL1 | 1-0:32.32.0 | Number of voltage dips on phase 1 |
| | voltageSagsL2 | 1-0:52.32.0 | Number of voltage dips on phase 2 |
| | voltageSagsL3 | 1-0:72.32.0 | Number of voltage dips on phase 3 |
| | voltageSwellsL1 | 1-0:32.36.0 | Number of voltage peaks on phase 1 |
| | voltageSwellsL2 | 1-0:52.36.0 | Number of voltage dips on phase 2 |
| | voltageSwellsL3 | 1-0:72.36.0 | Number of voltage dips on phase 3 |
| | instantaneousCurrentL1 | 1-0:31.7.0 | actual consumed current in Amperes on phase 1 |
| | instantaneousCurrentL2 | 1-0:51.7.0 | actual consumed current in Amperes on phase 2 |
| | instantaneousCurrentL3 | 1-0:71.7.0 | actual consumed current in Amperes on phase 3 |
| | instantaneousVoltageL1 | 1-0:32.7.0 | actual voltage on phase 1 |
| | instantaneousVoltageL2 | 1-0:52.7.0 | actual voltage on phase 2|
| | instantaneousVoltageL3 | 1-0:72.7.0 | actual voltage on phase 3|
| | instantaneousConsumedPowerL1 | 1-0:21.7.0 | actual consumed power in Watts on phase 1 |
| | instantaneousConsumedPowerL2 | 1-0:41.7.0 | actual consumed power in Watts on phase 2 |
| | instantaneousConsumedPowerL3 | 1-0:61.7.0 | actual consumed power in Watts on phase 3 |
| | instantaneousProducedPowerL1 | 1-0:22.7.0 | actual produced power in Watts on phase 1 |
| | instantaneousProducedPowerL2 | 1-0:42.7.0 |actual produced power in Watts on phase 2 |
| | instantaneousProducedPowerL3 | 1-0:62.7.0 | actual produced power in Watts on phase 3 |
| | switchPosition | 0-0:96.3.10 | Switch position Electricity (in/out/enabled) |
| **`gas`** | equipmentId | 0-n:96.1.0<br/>0-n:96.1.1 | |
| | timestamp | 0-n:24.2.1 | timestamp of the last measurement |
| | totalConsumed | 0-n:24.2.1 | measured total consumption |
| | reportedPeriod | 0-n:24.2.1 | period in minutes over which the total consumption is reported |
| | valvePosition | 0-n:24.4.0 |
| **`water`** | equipmentId | 0-n:96.1.0<br/>0-n:96.1.1 | |
| | timestamp | 0-n:24.2.1 | timestamp of the last measurement |
| | totalConsumed | 0-n:24.2.1 | measured total consumption |
| | reportedPeriod | 0-n:24.2.1 | period in minutes over which the total consumption is reported |
| | valvePosition | 0-n:24.4.0 | |

### Failures

DSMR version 4.x and 5.x might contain a failure event log which is reported as an array.

   Example:

   ```javascript
   [
        {
            "timestampEnd": 1291818255,
            "duration": 240
        },
        {
            "timestampEnd": 1291817404,
            "duration": 301
        }
   ]
   ```

### Parser

It is also possible to only use the parser without the connectivity logic:

```javascript
const parser = require('node-dsmr/lib/parser');

const telegram = [
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

console.log(parser(telegram))
```

### Logging

Winston is used for logging. This means when you configure Winston in your code, the module will start to log accordingly. For instance, when you add the following to your code:

``` javascript
const logger = require('winston')

logger.remove(logger.transports.Console)
logger.add(new logger.transports.Console({
  format: logger.format.combine(
    logger.format.timestamp(),
    logger.format.colorize(),
    logger.format.printf(event => {
      return `${event.timestamp} ${event.level}: ${event.message}`
    })
  ),
  level: 'debug'
}))
```

The module will start logging to stdout with level debug.
