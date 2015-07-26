/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
// Leave the above lines for propper jshinting

var mc = require('mongodb').MongoClient;
var collection; // the mongo-db collection
var  fs              = require('fs'),
    outputBuffer    = '',
    outputFile      = null,
    action          = null;

exportTrip("data_11560_741");


function exportTrip(tripId){
    // connect to database
    mc.connect("mongodb://localhost:27017/gps_debug", function(err, db) {
        if(err) { return console.dir(err); }
        startTrack(tripId);
        
        collection = db.collection(tripId);

        var stream = collection.find().stream();
        stream.on("data", function(item) {
            addPoint(item);
        });
        stream.on("end", function() {
            endTrack();
            output();
        });
    });
}

function startTrack(tripId){
     // buffer metadata
    buffer('<?xml version="1.0" encoding="UTF-8"?>' +
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpsies="http://www.gpsies.com/GPX/1/0" creator="GPSies http://www.gpsies.com - 2012-06-101917" version="1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.gpsies.com/GPX/1/0 http://www.gpsies.com/gpsies.xsd">' +
            '<metadata>' +
                '<generator>Intel Edison GPS Test via NodeJS</generator>' +
                    '<name>Edison trip ' + tripId + ' </name>' +
            '</metadata>' +
            '<trk>' +
                '<trkseg>');
}

function endTrack(){
     buffer('</trkseg></trk></gpx>');
}

function addPoint(point){
    // need to WGS84 from Dec Min to 
    buffer('<trkpt lat="' + getWGS84(point).lat + '" lon="' + getWGS84(point).lon + '">' +
                                    '<ele>' + point.alt + '</ele>' +
                                '<time>' + JSON.stringify(getDateFromNMEATime(point)) + '</time>' +
                            '</trkpt>');
}

function getDateFromNMEATime(coordObj){
    var d = new Date(); // TODO: extract from coordObj.date
    var t = coordObj.timestamp; // as string
    d.setHours(parseInt(t.substr(0,2)));
    d.setMinutes(parseInt(t.substr(2,2)));
    d.setSeconds ( parseInt(t.substr(4,2)));
    return d;
}

// convert from NMEA to WGS84
function getWGS84(coordObj){
    var lat = parseFloat(coordObj.lat);
    var lon = parseFloat(coordObj.lon);
    
    var fLat = (Math.floor(lat/100.0) + (lat % 100)/60.0); 
    var fLon = (Math.floor(lon/100.0) + (lon % 100)/60.0); 
    
    return {"lat":fLat, "lon":fLon};
}

/**
 * Callback method for outputting
 */
function output()
{
    if (!outputFile)
    {
        console.log(outputBuffer);
        exit();
    }
    else
    {
        writeBuffer(outputBuffer);
    }
}



/**
 * Buffer some output
 *
 * @param String data
 * @param Boolean newLine
 */
function buffer(data, newLine)
{
    outputBuffer += data + (newLine ? "\n" : '');
}



/**
 * Exit the process
 */
function exit()
{
    process.exit();
}



/**
 * Left pad string
 *
 * @param String input
 * @param int length
 * @param String fill
 */
function lpad(input, length, fill)
{
    input = '' + input;

    while (input.length < length)
    {
        input = fill + input;
    }

    return input;
}



/**
 * Ellips a given string
 *
 * @param String input
 * @param int length
 */
function ellipsis(input, length)
{
    if (input > length)
    {
        input = input.substr(0, length - 1) + "\u2026";
    }

    return input;
}



/**
 * Format given date to YYYY/MM/DD HH:II
 *
 * @param double date
 */
function formatDate(date)
{
    date = new Date(date * 1000);
    return '' + date.getFullYear() + '/' + lpad(date.getMonth(), 2, '0') + '/' + lpad(date.getDate(), 2, '0') + ' ' + lpad(date.getHours(), 2, '0') + ':' + lpad(date.getMinutes(), 2, '0');
}



/**
 * Write output buffer to file
 */
function writeBuffer()
{
    fs.writeFile(outputFile, outputBuffer, 'utf8', function (error) {
        if (error)
        {
            console.log('Could not write the file', error);
        }

        exit();
    });
}