/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

/*
The BLE - iBeacon Node.js sample application distributed within Intel® XDK IoT Edition under the IoT with Node.js Projects project creation option showcases how to advertise it's presence as a BLE ibeacon via Bluetooth Low Energy (BLE) communication.

MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.
Steps for installing/updating MRAA & UPM Library on Intel IoT Platforms with IoTDevKit Linux* image
Using a ssh client: 
1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
2. opkg update
3. opkg upgrade
OR
In Intel XDK IoT Edition under the Develop Tab (for Internet of Things Embedded Application)
Develop Tab
1. Connect to board via the IoT Device Drop down (Add Manual Connection or pick device in list)
2. Press the "Settings" button
3. Click the "Update libraries on board" option

Review README.md file for more information about enabling bluetooth and completing the desired configurations.


*/

var execFile = require('child_process').execFile;
var dgram;
var UDP_PORT = 5005;
var UDP_IP = "127.0.0.1";
var uriBeacon;
var mdns;
var serverSocket;
var SERVER_IP = "http://192.168.1.116";
var SERVER_SOCKET_PORT = 2357;
var SERVER_SOCKET_URL = SERVER_IP + ":" + SERVER_SOCKET_PORT.toString();

function init() {
    execFile('rfkill unblock bluetooth');
    execFile('killall bluetoothd');
    execFile('hciconfig hci0 up');
    
	createUdpServer();
	createUriBeacon();
	createMdnsBeacon();
	createServerSocket();
}

function createUdpServer() {
	dgram = require('dgram');
	var server = dgram.createSocket('udp4');
	server.on('listening', function () {
	    var address = server.address();
	    console.log('udp server listening on ' + address.address + ":" + address.port);
	});
	server.on('message', function (message, remote) {
	    handleUdpMessage(message);
	});
	server.bind(UDP_PORT, UDP_IP);
}

function createUriBeacon() {
	uriBeacon = require('uri-beacon/uri-beacon');
	var bleno = require('uri-beacon/node_modules/bleno');

	var template = new Buffer(10); // maximum 31 bytes
	template[0] = 0x03; // Length
	template[1] = 0x03; // Parameter: Service List
	template[2] = 0xD8; // URI Beacon ID
	template[3] = 0xFE; // URI Beacon ID
	template[4] = 0x00; // Length <-- must be updated
	template[5] = 0x16; // Service Data
	template[6] = 0xD8; // URI Beacon ID
	template[7] = 0xFE; // URI Beacon ID
	template[8] = 0x00; // Flags
	template[9] = 0xE7; // Power

	var scanData = new Buffer(0); // maximum 31 bytes
	var encoded = uriBeacon.encode(SERVER_IP);
	var advertisementData = Buffer.concat([template, encoded], template.length + encoded.length);
	advertisementData[4] = encoded.length + 5;

	bleno.startAdvertisingWithEIRData(advertisementData, scanData);
	console.log("broadcasting url: " + SERVER_IP);
}

function createMdnsBeacon() {
	mdns = require("mdns");
	var ad = mdns.createAdvertisement(mdns.tcp('http'), 5353, {name:SERVER_IP});
	ad.start();
}

function createServerSocket() {
	serverSocket = require("socket.io-client")(SERVER_SOCKET_URL);
	serverSocket.on("connect", function() {
	  	console.log("connected to server socket: " +  SERVER_SOCKET_URL);
	});
}

function handleUdpMessage(message) {
	console.log("handleUdpMessage: " + message);
	if (message == "on_board_button_press") {
		sendButtonStateMessageToServer("pressed");
	}
}

function sendButtonStateMessageToServer(buttonState) {
	console.log("sendButtonStateMessageToServer: " + buttonState);
	var buttonStateMessage = {"buttonState": buttonState};
	var json = JSON.stringify(buttonStateMessage);
	serverSocket.emit("buttonState", buttonStateMessage);
}

init();