/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
// Leave the above lines for propper jshinting


var nmea = require('nmea');
var serialport = require('serialport');
var mc = require('mongodb').MongoClient;
var collection; // the mongo-db collection
var gpsObj;
var lastPos = {"lat": 0, "lon": 0};
var lastUpdate = 0;
var strDate = null;
var minTimeDist = 2; // no more than every 15 seconds a datapoint

// FIXME: MRAA is segfaulting node.js on edison
//var mraa = require('mraa'); 
//var uart = new mraa.Uart(0); 
//console.log("start GPS decoder on port " + uart.getDevicePath());
//console.log('MRAA Version: ' + mraa.getVersion());

var dbTimer = setTimeout(openDB, 2000);
openPort("/dev/ttyMFD1");
//openPort(uart.getDevicePath());

// connect to database, clear timeout on success
function openDB(){
    if (!collection){
        mc.connect("mongodb://localhost:27017/gps_debug", function(err, db) {
            if(err) { console.dir(err); }
            var cDate = new Date();
            var cName = 'data_' + cDate.getFullYear() + "" + cDate.getMonth() + "" + cDate.getDate() + "_" + cDate.getHours()+1 + "" +  cDate.getMinutes();
            console.log ("using collection " + cName + " for storage of gps data with min distance of " + minTimeDist + " seconds");
            collection = db.collection(cName);
            clearInterval(dbTimer);
        });
    }
}

// open serialport
function openPort(portName){
    var port = new serialport.SerialPort(portName, {
        baudrate: 38400,
        parser: serialport.parsers.readline('\r\n'),
        dataBits: 8, 
        parity: 'none', 
        stopBits: 1, 
        flowControl: false 

    });

    port.on('data', onDataHandler);
}

function onDataHandler(line){
    if (line.charAt(0) == "$"){ 
        try {
            gpsObj = nmea.parse(line);
            if (gpsObj.sentence == 'RMC'){
                strDate = gpsObj.date;
            } else if (strDate !== null && (lastPos.lat != gpsObj.lat || lastPos.lon != gpsObj.lon) && gpsObj.sentence == 'GGA' && (Date.now()/1000-lastUpdate) > minTimeDist){
                lastUpdate = Date.now()/1000;
                lastPos.lat = gpsObj.lat;
                lastPos.lon = gpsObj.lon;
                gpsObj.date = strDate; // insert date as normal points don't have it
                console.log( strDate + " " + gpsObj.timestamp + ": lat = " + gpsObj.lat + " / long = " + gpsObj.lon);
                if (collection){
                    collection.insert(gpsObj);
                }
            }
        } catch (e){
            console.error("couldn't parse " + e);
        } 
    }
}