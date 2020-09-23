# DSMR (Dutch Smart Meter Requirements) Parser

[![Build](https://github.com/reneklootwijk/node-dsmr/workflows/build/badge.svg)](https://github.com/reneklootwijk/node-dsmr/actions)
[![Coverage Status](https://coveralls.io/repos/github/reneklootwijk/node-dsmr/badge.svg?branch=master)](https://coveralls.io/github/reneklootwijk/node-dsmr?branch=master)
[![npm](https://img.shields.io/npm/v/node-dsmr)](https://www.npmjs.com/package/node-dsmr)

The parser supports telegrams compliant to DSMR version 2.x, 3.x, 4.x and 5.x.

## Installation
```bash
$ npm install node-dsmr
```

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
* `baudrate`, the rate at which the P1 port communicates, for DSMR 2.2 and 3.0 meters this is `9600` and for 4.x this is `115200`.
* `databits`, the number of bits used, for DSMR 2.2 and 3.0 meters this is `7` and for 4.x this is `8`.
* `parity`, the parity used, for DSMR 2.2 and 3.0 this is `even` and for 4.x this is `none`.

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
        power: {
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
            timestamp: 1234450800,
            valvePosition: 1
        },
        meterModel: 'ISk5\\2MT382-1000'
    }
    ```

* `update`, a new telegram has been received with updated metrics, the data of the event contains the updated metrics as JSON. The power metrics presenting the actual consumption and/or production are continuously measured and for that reason always included in the update event, even when the actual value is the same as the previous measurement. The gas metrics presenting the total consumption is measured periodically as indicated with the included timestamp. When the timestamp indicates a new measurement has been performed, the value is included in the update event even when the measurement is the same as the previous measurement.
    
    Example:
    ```javascript
    {
        "power": {
            "totalConsumed1": 123456.789,
            "activeTariff": 1,
            "actualConsumed": 1.193,
            "actualProduced": 0
        }
    }
     ```
### Reported metrics
The following metrics are reported when they are included in the telegram received from the P1 port:

| Category | Metric | Description                                  |
|-|-|-|
| | meterModel | |
| | dsmrVersion| only report for DSMR version 4.x and 5.x |
| | timestamp | timestamp of the telegram |
| **`power`** | equipmentId | |
| | totalConsumed1 | total consumption in tariff 1 (off-peak) |
| | totalConsumed2 | total consumption in tariff 2 (peak) |
| | totalProduced1 | total production in tariff 1 (off-peak) |
| | totalProduced2 | total production in tariff 2 (peak) |
| | actualConsumed | |
| | actualProduced | |
| | actualTariff | active tariff (1=off-peak or 2=peak) |
| | failureLog | power failure event log (see below) |
| | failures | number of power failures |
| | failuresLong | number of long power failures |
| | voltageSagsL1 | |
| | voltageSagsL2 | |
| | voltageSagsL3 | |
| | voltageSwellsL1 | |
| | voltageSwellsL2 | |
| | voltageSwellsL3 | |
| | instantaneousCurrentL1 | |
| | instantaneousCurrentL2 | |
| | instantaneousCurrentL3 | |
| | instantaneousVoltageL1 | |
| | instantaneousVoltageL2 | |
| | instantaneousVoltageL3 | |
| | instantaneousConsumedElectricityL1 | |
| | instantaneousConsumedElectricityL2 | |
| | instantaneousConsumedElectricityL3 | |
| | instantaneousProducedElectricityL1 | |
| | instantaneousProducedElectricityL2 | |
| | instantaneousProducedElectricityL3 | |
| | switchPosition | |
| **`gas`** | equipmentId | |
| | timestamp | timestamp of the last measurement |
| | totalConsumed | measured total consumption |
| | reportedPeriod | period in minutes over which the total consumption is reported |
| | valvePosition | |

### Failures
DSMR version 4.x and 5.x might contain a failure event log which is reported as an array. Example:
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

```
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