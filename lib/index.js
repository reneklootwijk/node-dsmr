'use strict';

const EventEmitter = require('events').EventEmitter;
const Connection = require('./connection');
const logger = require('winston');
const parser = require('./parser');
const crc = require('./crc');

// Add a transport as fall back when no parent logger has been initialized
// to prevent the error: "Attempt to write logs with no transports"
logger.add(new logger.transports.Console({
  level: 'none'
}));

function findUpdates (current, telegram) {
  var updates = {};

  for (const key in telegram.electricity) {
    // Determine what has been updated.
    // Note: electricity.actualConsumed and electricity.actualProduced must always be
    //       reported because they represent the actual readings
    if (
      current.electricity[key] === undefined ||
      current.electricity[key] !== telegram.electricity[key] ||
      key === 'actualConsumed' ||
      key === 'actualProduced') {
      if (!updates.electricity) {
        updates.electricity = {};
      }

      current.electricity[key] = telegram.electricity[key];

      // Add the key to the updates to be reported
      updates.electricity[key] = telegram.electricity[key];
    }
  }

  // The gas consumption must only be updated when the timestamp changes because this
  // indicates a new reading has been performed
  if (!current.gas.timestamp || telegram.gas.timestamp > current.gas.timestamp) {
    updates.gas = {};

    // Note: gas.consumedLastPeriod must always be reported because it represents the actual consumption
    //       in the last period
    if (current.gas.totalConsumed) {
      updates.gas.reportedPeriod = telegram.gas.reportedPeriod;
      updates.gas.consumedLastPeriod = Math.round((telegram.gas.totalConsumed - current.gas.totalConsumed) * 1000) / 1000;
    }

    if (!current.gas.totalConsumed || current.gas.totalConsumed < telegram.gas.totalConsumed) {
      updates.gas.totalConsumed = telegram.gas.totalConsumed;
      current.gas.totalConsumed = telegram.gas.totalConsumed;
    }

    if (!current.gas.valvePosition || current.gas.valvePosition !== telegram.gas.valvePosition) {
      updates.gas.valvePosition = telegram.gas.valvePosition;
      current.gas.valvePosition = telegram.gas.valvePosition;
    }

    // Update the last reported timestamp
    current.gas.timestamp = telegram.gas.timestamp;
    updates.gas.timestamp = telegram.gas.timestamp;
  }

  // The water consumption must only be updated when the timestamp changes because this
  // indicates a new reading has been performed
  if (!current.water.timestamp || telegram.water.timestamp > current.water.timestamp) {
    updates.water = {};

    // Note: water.consumedLastPeriod must always be reported because it represents the actual consumption
    //       in the last period
    if (current.water.totalConsumed) {
      updates.water.reportedPeriod = telegram.water.reportedPeriod;
      updates.water.consumedLastPeriod = Math.round((telegram.water.totalConsumed - current.water.totalConsumed) * 1000) / 1000;
    }

    if (!current.water.totalConsumed || current.water.totalConsumed < telegram.water.totalConsumed) {
      updates.water.totalConsumed = telegram.water.totalConsumed;
      current.water.totalConsumed = telegram.water.totalConsumed;
    }

    if (!current.water.valvePosition || current.water.valvePosition !== telegram.water.valvePosition) {
      updates.water.valvePosition = telegram.water.valvePosition;
      current.water.valvePosition = telegram.water.valvePosition;
    }

    // Update the last reported timestamp
    current.water.timestamp = telegram.water.timestamp;
    updates.water.timestamp = telegram.water.timestamp;
  }

  return updates;
}

module.exports = class SmartMeter extends EventEmitter {
  constructor (options = {}) {
    super();

    this._connection = new Connection(options);

    this._ignoreCrc = options.disableCrcChecking || false;

    this._currentValues = { power: {}, gas: {} };
    this._inProgress = false;
  }

  connect () {
    var self = this;
    var telegram = [];

    self._connection.on('connected', () => {
      self.emit('connected');
    });

    self._connection.on('data', line => {
      let full;
      let updates;
      let calculatedCrc;
      let reportedCrc;

      // Add line to buffer
      telegram.push(line);

      // When last line has been received start processing
      if (line[0] === '!') {
        const result = line.match(/!([a-fA-F0-9]+)/);
        if (result !== null) {
          reportedCrc = parseInt(result[1], 16);
          calculatedCrc = crc(telegram);
        }

        // Only process telegram without crc or with a validated crc
        if (reportedCrc === calculatedCrc || !reportedCrc || self._ignoreCrc) {
          full = parser(telegram);

          if (full) {
            logger.debug(`SmartMeter: Telegram ${JSON.stringify(full)}`);
            self.emit('telegram', full);

            updates = findUpdates(self._currentValues, full);

            // Emit the updated properties of the telegram only
            if (Object.keys(updates).length) {
              logger.debug(`SmartMeter: Updates ${JSON.stringify(updates)}`);
              self.emit('update', updates);
            }
          }
        } else {
          if (reportedCrc) {
            logger.error(`Telegram is not processed because of corruption (${reportedCrc.toString(16)}/${calculatedCrc.toString(16)})`);
          }
        }

        telegram = [];
      }
    });

    self._connection.on('disconnected', () => {
      self.emit('disconnected');
    });

    self._connection.connect();
  }
};
