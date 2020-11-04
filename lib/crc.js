'use strict'

module.exports = telegram => {
  let crc = 0

  telegram.forEach(line => {
    if (line[0] !== '!') {
      line = line + '\n'
    } else {
      line = '!'
    }

    for (let i = 0; i < line.length; i++) {
      crc ^= line.charCodeAt(i)
      for (let j = 8; j > 0; j--) {
        if ((crc & 0x0001) !== 0) {
          crc >>= 1
          crc ^= 0xA001
        } else {
          crc >>= 1
        }
      }
    }
  })

  return crc
}
