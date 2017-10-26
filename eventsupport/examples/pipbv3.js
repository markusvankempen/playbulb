/************************************************************************
* Copyright 2016 IBM Corp. All Rights Reserved.
************************************************************************
*
* mvk@ca.ibm.com
* Set basic Candle function and Candle name
* date: 2017-11-01
************************************************************************
*
* This porgram controls a playbulb ble using a Pi or a PC/MAC with BT.
*
************************************************************************
* Syntax:
* node pipb.js playbulb mac blue
* node pipb.js playbulb mac blue flash
*
************************************************************************
*/

var NobleDevice = require('../lib/noble-device');
NobleDevice.Util = require('../lib/util');

var idOrLocalName = process.argv[2];
var setcolor = process.argv[3];
var setmode = process.argv[4];
var setname = process.argv[5];

if (!idOrLocalName) {
  console.log("node program.js [BLE ID or local name] color mode");
  process.exit(1);
}

var CandleDevice = function(device) {
  NobleDevice.call(this, device);
};

CandleDevice.is = function(device) {
  var localName = device.advertisement.localName;
  //console.log(device.advertisement);
  try{
      console.log(" id: " +device.id + " name: "+localName);
//  var Manu = new Buffer(device.advertisement.manufacturerData).toString('ascii');

//  console.log(" id: " +device.id + " name: "+localName+ " Manu:"+Manu);
  if(device.id === idOrLocalName)// || localName === idOrLocalName);
  {

  //  NobleDevice.stopScanning()
    return true;
  }
}catch(e){
    console.log("Could not get Manufacting data ")
    return false;
  }
};

NobleDevice.DeviceInformationService = require('../lib/device-information-service');
NobleDevice.BatteryService = require('../lib/battery-service');
NobleDevice.CandleService = require('../lib/candle-service');

NobleDevice.Util.inherits(CandleDevice, NobleDevice);
NobleDevice.Util.mixin(CandleDevice, NobleDevice.DeviceInformationService);
NobleDevice.Util.mixin(CandleDevice, NobleDevice.BatteryService);
NobleDevice.Util.mixin(CandleDevice, NobleDevice.CandleService);

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

CandleDevice.discoverAll(function(device) {
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
    CandleDevice.stopScanning();
    setCandleColor(0,0,0);
    setCandleColor(0,255,0);

  //  setCandleOn();
  //console.log("setcolor = "+setcolor);
  //console.log("setmode = "+setmode);

      if (setmode  == null)
      {
        if (setcolor === "red")
              setCandleColor(255,0,0);

        if (setcolor === "blue")
            setCandleColor(0,0,255);

        if (setcolor === "green")
            setCandleColor(0,255,0);

        if (setcolor === "off")
            setCandleColor(0,0,0);

        if (setcolor === "on")
          setCandleColor(255,255,255);


        }else if (setmode  == "candle")
        {
            //(r,g,b,mode,speed1,speed2)

            setCandleMode(0,255,255,4,10,0);
        }
        else if (setmode  == "rainbow")
        {
                 if (setcolor === "blue"){
                    setCandleMode(0,0,255,02,95,0);
                  }else {
                    //yellow
                    setCandleMode(0,255,255,02,95,0);
                  }
        }

        //00 7e ff 00 00 00 19 00"
        else if (setmode  == "flash")
        {
         if (setcolor === "blue")
            setCandleMode(0,0,255,0,19,0);
         if (setcolor === "green")
            setCandleMode(0,255,0,0,19,0);
         if (setcolor === "red")
            setCandleMode(255,0,0,0,19,0);

          }else if (setmode = "name")
          {


          data = new Buffer(setname)
           device.setName(data,function() {
             console.log('setName to '+setname);
             device.getName(function(error,data) {
               console.log('getName  = '+ data);

               if( data == setname)
                  console.log('>>> Name change worked  ');
             });

           });

         }


        device.readManufacturerName(function(error,data) {
          console.log('Manufacturer = '+data);
        });

        device.readModelNumber(function(error,data) {
          console.log('ModelNumber   = '+data);
        });

        device.readBatteryLevel(function(error,data) {
        //  batLevel =   parseInt(bytesToHex(data),16);
            console.log("BatteryLevel  = "+data);
        })

        device.getCurrentColor(function(error,data) {

           console.log('ColorCode     = xxRRGGBB');
           console.log('CurrentColor  = '+ bytesToHex(data));
         });


    });//connectAndSetUp

  /************************************************************************
   * PlayBulb Functions
   ************************************************************************/


function setCandleMode (r,g,b,mode,speed1,speed2){
// mode =01 = Fade, 02 = Jump RBG (rainbow), 03 = Fade RGB (rainbow), 04 = Candle Effect
//new Buffer([0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]]);
data = new Buffer([0, r, g, b, mode,0,speed1,speed2]);

      console.log("modes: 00= flash , 01 = Fade, 02 = Jump RBG (rainbow), 03 = Fade RGB (rainbow), 04 = Candle Effect");
      console.log('Writing effect data:'+mode);
      device.setMode( data,function() {
       console.log("setMode");
     });

     //Value: [white][red][green][blue][mode][00][speed][00]
         device.getMode(function(error,data) {
           console.log('ModeCode         = xxRRGGBBMMxxS1S2');
           console.log('CurrentMode      = '+ bytesToHex(data));
         });
}

function setCandleColor(r,g,b)
  {
    //reset move into service
  //  data = new Buffer([0, 0, 0, 0, 0,0,0,0]);
  //  device.setMode( data,function() {});

    device.setCurrentColor(new Buffer([0, r, g , b]), function() {
     console.log("Set Color to r="+r+" g="+g+" b="+b);
       });
}


  });// discover
