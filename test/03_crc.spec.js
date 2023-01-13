const assert = require('chai').assert;
const crc = require('../lib/crc');

const dsmr4 = [
  '/ISk5\\MT174-001\r',
  '\r',
  '1-3:0.2.8(50)\r',
  '0-0:1.0.0(180804122151W)\r',
  '1-0:1.8.1(0000.000*kWh)\r',
  '1-0:1.8.2(0000.000*kWh)\r',
  '1-0:2.8.1(0000.000*kWh)\r',
  '1-0:2.8.2(0000.000*kWh)\r',
  '0-0:96.14.0(0001)\r',
  '1-0:1.7.0(0000.000*kW)\r',
  '1-0:2.7.0(0000.000*kW)\r',
  '0-0:96.7.21(00000)\r',
  '0-0:96.7.9(00000)\r',
  '1-0:99.97.0(0)(0-0:96.7.19)\r',
  '1-0:32.32.0(00000)\r',
  '1-0:52.32.0(00000)\r',
  '1-0:72.32.0(00000)\r',
  '1-0:32.36.0(00000)\r',
  '1-0:52.36.0(00000)\r',
  '1-0:72.36.0(00000)\r',
  '0-0:96.13.0(0)\r',
  '1-0:32.7.0(000.0*V)\r',
  '1-0:52.7.0(000.0*V)\r',
  '1-0:72.7.0(000.0*V)\r',
  '1-0:31.7.0(000.0*A)\r',
  '1-0:51.7.0(000.0*A)\r',
  '1-0:71.7.0(000.0*A)\r',
  '!02AD'
];

const dsmr5 = [
  '/XMX5LGF0010455307579\r',
  '\r',
  '1-3:0.2.8(50)\r',
  '0-0:1.0.0(201003203959S)\r',
  '0-0:96.1.1(4530303637303035353330373537393230)\r',
  '1-0:1.8.1(000526.479*kWh)\r',
  '1-0:1.8.2(000583.955*kWh)\r',
  '1-0:2.8.1(000000.000*kWh)\r',
  '1-0:2.8.2(000000.000*kWh)\r',
  '0-0:96.14.0(0001)\r',
  '1-0:1.7.0(00.781*kW)\r',
  '1-0:2.7.0(00.000*kW)\r',
  '0-0:96.7.21(00010)\r',
  '0-0:96.7.9(00002)\r',
  '1-0:99.97.0(1)(0-0:96.7.19)(000101010000W)(0000000232*s)\r',
  '1-0:32.32.0(00006)\r',
  '1-0:52.32.0(00005)\r',
  '1-0:72.32.0(00005)\r',
  '1-0:32.36.0(00000)\r',
  '1-0:52.36.0(00000)\r',
  '1-0:72.36.0(00000)\r',
  '0-0:96.13.0()\r',
  '1-0:32.7.0(230.2*V)\r',
  '1-0:52.7.0(234.3*V)\r',
  '1-0:72.7.0(228.7*V)\r',
  '1-0:31.7.0(001*A)\r',
  '1-0:51.7.0(002*A)\r',
  '1-0:71.7.0(000*A)\r',
  '1-0:21.7.0(00.298*kW)\r',
  '1-0:41.7.0(00.458*kW)\r',
  '1-0:61.7.0(00.025*kW)\r',
  '1-0:22.7.0(00.000*kW)\r',
  '1-0:42.7.0(00.000*kW)\r',
  '1-0:62.7.0(00.000*kW)\r',
  '0-1:24.1.0(003)\r',
  '0-1:96.1.0(4730303738353635353836323132323230)\r',
  '0-1:24.2.1(201003203926S)(00035.545*m3)\r',
  '!459C'
];

describe('CRC tests:', function () {
  var result;

  it('calculate CSR for DSMR4 telegram', function () {
    result = crc(dsmr4);
    assert.strictEqual(result, 0x02AD, 'incorrect CRC');
  });

  it('calculate CSR for DSMR5 telegram', function () {
    result = crc(dsmr5);
    assert.strictEqual(result, 0x459C, 'incorrect CRC');
  });
});
