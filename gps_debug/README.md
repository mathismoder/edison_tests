Edison Node.js GPS Test-App
============================
This project is created with the Intel XDK.

Using Edison + breakout board + Navilock NL-552ETTL (any comparable GPS should work) 
to retrieve and save data to MongoDB.

Connection of GPS to Edison
---------------------------

(See also http://download.intel.com/support/edison/sb/edisonbreakout_hg_331190006.pdf)
* J18 - 13 is UART1 RX, connect to TX of GPS
* J19 - 8 is UART1 TX, connect to RX of GPS (but not needed in this case)
* J19 - 3 is GND, connect to GND
* J20 - 1 is Power/VSYS, connect to VCC

Installation of MongoDB
-----------------------

Install systemwide mongo-db npm: 
<pre>$ npm install -g mongodb</pre>

Download binary mongodb package from https://www.mongodb.org/downloads (Legacy 32-Bit Linux).
Untar and copy to /usr/bin/.

Start manually:
<pre>mongodb --dbpath $yourpath$ --syslog --journal</pre>
or create a systemd launch script.
