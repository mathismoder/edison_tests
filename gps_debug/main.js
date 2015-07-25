/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
// Leave the above lines for propper jshinting

var mraa = require('mraa'); //require mraa
var nmea = require('nmea');
var serialport = require('serialport');
var mc = require('mongodb').MongoClient;
var collection; // the mongo-db collection
var gpsObj;
var last = 0;
var minTimeDist = 15; // no more than every 15 seconds a datapoint
var uart = new mraa.Uart(0); // needed?

console.log("start GPS decoder on port " + uart.getDevicePath());
console.log('MRAA Version: ' + mraa.getVersion());


// connect to database
mc.connect("mongodb://localhost:27017/gps_debug", function(err, db) {
    if(err) { return console.dir(err); }
    var cDate = new Date();
    var cName = 'data_' + cDate.getYear().toString() + cDate.getMonth().toString() + cDate.getDay().toString() + "_" + cDate.getHours().toString() + cDate.getMinutes().toString();
    console.log ("using collection " + cName + " for storage of gps data with min distance of " + minTimeDist + " seconds");
    collection = db.collection(cName);  
});

// open serialport
var port = new serialport.SerialPort(uart.getDevicePath(), {
    baudrate: 38400,
    parser: serialport.parsers.readline('\r\n'),
    dataBits: 8, 
    parity: 'none', 
    stopBits: 1, 
    flowControl: false 

});

// serial data handler
port.on('data', function(line) {
  //  console.log(line);
    if (line.charAt(0) == "$"){ 
        try {
            gpsObj = nmea.parse(line);
            if (gpsObj.type == 'fix' && (Date.now()/1000-last) > minTimeDist){
                last = Date.now()/1000;
                console.log( gpsObj.timestamp + ": lat = " + gpsObj.lat + " / long = " + gpsObj.lon);
                if (collection){
                    collection.insert(gpsObj);
                }
            }
        } catch (e){
            console.error("couldn't parse " + e);
        } 
    }
});