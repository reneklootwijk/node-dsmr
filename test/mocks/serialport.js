const EventEmitter = require('events').EventEmitter

module.exports = class Serialport extends EventEmitter {
  constructor (options = {}) {
    // Call constructor of the EventEmitter class
    super()

    this.parser = null
  }

  mockDisconnect () {
    this.emit('close')
  }

  mockData (data) {
    if (Array.isArray(data)) {
      for (const row in data) {
        this.parser.emit('data', data[row])
      }
    } else {
      this.parser.emit('data', data)
    }
  }

  open () {
    this.emit('open')
  }

  pipe () {
    this.parser = new Parser()

    return this.parser
  }
}

class Parser extends EventEmitter {
  constructor (options = {}) {
    // Call constructor of the EventEmitter class
    super()
  }
}
