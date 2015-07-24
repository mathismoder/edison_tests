/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
// Leave the above lines for propper jshinting
//Type Node.js Here :)

var mraa = require('mraa'); //require mraa
var nmea = require('nmea');
var serialport = require('serialport');


console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console
console.log("start GPS decoder");

var uart = new mraa.Uart(0); // needed?
console.log(uart.getDevicePath())
 
var port = new serialport.SerialPort(uart.getDevicePath(), {
                baudrate: 38400,
                parser: serialport.parsers.readline('\r\n')});
    
port.on('data', function(line) {
    console.log(nmea.parse(line));
});