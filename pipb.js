/************************************************************************
* Copyright 2016 IBM Corp. All Rights Reserved.
************************************************************************
*
* mvk@ca.ibm.com
* adjustemts for Connect2017 Workshop - Part 1
* date: 2017-01-11
************************************************************************
*
* This porgram controls a playbulb ble using a Pi or a PC/MAC with BT.
*
************************************************************************
* Syntax: 
* node pipb.js playbulb mac blue 
* node pipb.js playbulb mac blue candle
*
* 
*/

var NobleDevice = require('../lib/noble-device');
NobleDevice.Util = require('../lib/util');

var idOrLocalName = process.argv[2];
var setcolor = process.argv[3];
var setmode = process.argv[4];
var setname = process.argv[5];

if (!idOrLocalName) {
  console.log("node program.js [BLE ID or local name or ??? to list ble devices]");
  process.exit(1);
}

var CandleDevice = function(device) {
  NobleDevice.call(this, device);
};

CandleDevice.is = function(device) {
  var localName = device.advertisement.localName;
  console.log(" id: " +device.id + " name: "+localName);
  return (device.id === idOrLocalName || localName === idOrLocalName);
};

NobleDevice.Util.inherits(CandleDevice, NobleDevice);

CandleDevice.prototype.getBatteryLevel = function(callback) {
  this.readDataCharacteristic('180f', '2a19', callback);
};

CandleDevice.prototype.getCurrentColor = function(callback) {
  this.readDataCharacteristic('ff02', 'fffc', callback);
};

CandleDevice.prototype.candleName = function(callback) {
    this.readDataCharacteristic('ff02', 'ffff', callback);
};

CandleDevice.prototype.read = function(serviceUUID,charUUID,callback) {
  this.readDataCharacteristic(serviceUUID, charUUID, callback);
};

CandleDevice.prototype.write = function(serviceUUID,charUUID,data,callback) {
  this.writeDataCharacteristic(serviceUUID, charUUID,data, callback);
};
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function hexToBytes(hex) {
        for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    };

function bytesToHex (bytes) {
        for (var hex = [], i = 0; i < bytes.length; i++) {
            hex.push((bytes[i] >>> 4).toString(16));
            hex.push((bytes[i] & 0xF).toString(16));
        }
        return hex.join("");
    };

var candleName="";
var batLevel="";
var candleColor="";
var rr="";
var bb="";
var gg="";
var cmode;
/************************************************************************
 * Discover BLE devices
 ************************************************************************/

CandleDevice.discover(function(device) {
  console.log('discovered: ' + device);

  device.on('disconnect', function() {
    console.log('disconnected!');
    process.exit(0);
  });

  device.on('Change', function(data) {
    console.log("update : " + data);
  });

  device.connectAndSetUp(function(callback) {
    console.log('ConnectAndSetUp');

    device.getBatteryLevel(function(error,data) {
      if(error)
        console.log('getBatteryLevel error = '+error);

      batLevel =   parseInt(bytesToHex(data),16);
      batLevel = bytesToHex(data);
    })

    setCandleOn();
  console.log("setcolor = "+setcolor);

        if (setcolor === "red")
            setCandleRed();

        if (setcolor === "blue")
            setCandleColor(0,0,255);

            if (setcolor === "green")
                setCandleColor(0,255,0);

        if (setcolor === "off")
            setCandleColor(0,0,0);

        if (setcolor === "on")
          setCandleColor(255,255,255);

        if (setmode  == "candle")
        {
          setModeCandleLight();
        }
        if (setmode  == "rainbow")
        {
          setCandleMode(255,0,255,02,95,0);
        }


        //00 7e ff 00 00 00 19 00"
        if (setmode  == "flash")
        {
          setCandleMode(0,0,255,0,19,0);
        }



    });//connectAndSetUp




  /************************************************************************
   * PlayBulb Functions
   ************************************************************************/

function setModeCandleLight (){
  // mode 4
//new Buffer([0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]]);
  device.write('ff02','fffb',new Buffer([0, 255, 255, 0, 4,0,1,0 ]),function() {
     console.log('Setting candle to CandleMode = 04 = Candle Effect.');
   });
}

function setCandleMode (r,g,b,mode,speed1,speed2){
// mode =01 = Fade, 02 = Jump RBG (rainbow), 03 = Fade RGB (rainbow), 04 = Candle Effect
//new Buffer([0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]]);
  device.write('ff02','fffb',new Buffer([0, r, g, b, mode,0,speed1,speed2]),function() {
     console.log("modes:01 = Fade, 02 = Jump RBG (rainbow), 03 = Fade RGB (rainbow), 04 = Candle Effect");
     console.log('Writing effect data:'+mode);
     readCandleMode(true);
   });
}

function readCandleMode (log){
// mode =01 = Fade, 02 = Jump RBG (rainbow), 03 = Fade RGB (rainbow), 04 = Candle Effect
//new Buffer([0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]]);
  device.read('ff02','fffb',function(error,data1) {
    if(log)
    {
    console.log('ModeCode         = xxRRGGBBMMxxS1S2');
    console.log('CurrentModeCode  = '+ bytesToHex(data1));
  }
    return  bytesToHex(data1);
   });
}

function setCandleBlue()
{
  setCandleColor(0,0,255)
}


function setCandleColor(r,g,b)
  {
// read and write color
     device.read('ff02','fffc', function(error,data1) {
      console.log('ColorCode     = xxRRGGBB');
      console.log('CurrentColor  = '+ bytesToHex(data1));
      // write color
          device.write('ff02','fffc',new Buffer([0, r, g , b]), function() {
           console.log("Set Color to r="+r+" g="+g+" b="+b);


         });
    });
}
function setCandleYellow(){
  setCandleColor(255,255,0);
}

function setCandleGreen(){
  setCandleColor(0,255,0);
}
function setCandleRed(){
      // write color
          device.write('ff02','fffc',new Buffer([0, 255, 0, 0]), function() {
           console.log("#Set Color to RED");
         });
}

function setCandleOn(){
      // write color
          device.write('ff02','fffc',new Buffer([0, 0, 0, 255]), function() {
           console.log("#Set Candle to On");
         });
}

function setCandleOff(){
      // write color
          device.write('ff02','fffc',new Buffer([0, 0, 0, 0]), function() {
           console.log("#Set Candle to Off");
         });
}

  });// discover
