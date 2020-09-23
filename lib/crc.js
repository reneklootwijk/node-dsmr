'use strict'

const crc16Table = []

module.exports = telegram => {
  let crc = 0
  telegram.forEach(line => {
    for (let i = 0; i < line.length; i++) {
      const val = crc ^ line.charCodeAt(i)
      crc = (val >> 8) ^ crc16Table[(val & 0x00ff)]
    }
  })

  return crc
}

// Create CRC16 table
for (let i = 0; i < 256; i++) {
  let crc = i

  for (let j = 0; j < 8; j++) {
    if (crc & 0x0001) {
      crc = (crc >> 1) ^ 0xA001
    } else {
      crc = (crc >> 1)
    }
  }

  crc16Table.push(crc)
}
