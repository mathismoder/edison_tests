/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
// Leave the above lines for propper jshinting

var mraa = require('mraa'); //require mraa
var nmea = require('nmea');
var serialport = require('serialport');
var mc = require('mongodb').MongoClient;
var collection; // the mongo-db collection

console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console

var uart = new mraa.Uart(0); // needed?
console.log("start GPS decoder on port " + uart.getDevicePath());
 
var port = new serialport.SerialPort(uart.getDevicePath(), {
                baudrate: 38400,
                parser: serialport.parsers.readline('\r\n')});
    
port.on('data', function(line) {
    console.log(nmea.parse(line));
    if (collection){
        collection.insert(nmea.parse(line));
    }
});

mc.connect("mongodb://localhost:27017/gps_debug", function(err, db) {
    if(err) { return console.dir(err); }
    db.createCollection('data', function(err, collection) {
        return console.dir(err);
    });
    collection = db.collection('data');

  
});