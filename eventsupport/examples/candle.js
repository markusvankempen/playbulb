/************************************************************************
* Copyright 2016 IBM Corp. All Rights Reserved.
************************************************************************
*
* mvk@ca.ibm.com
* Testing basic Candle function SetColor,Mode Event for BlowOnOFF
* date: 2017-01-11
************************************************************************
*
* This porgram test a playbulb ble using a Pi or a PC/MAC with BT.
*
************************************************************************
* Syntax:
* node pipb.js playbulbid
* node pipb.js playbulb
*
************************************************************************
*/

var NobleDevice = require('../index');

var idOrLocalName = process.argv[2];

if (!idOrLocalName) {
  console.log("node hrm-device.js [ID or local name]");
  process.exit(1);
}

var HRMDevice = function(device) {
  NobleDevice.call(this, device);
};

HRMDevice.is = function(device) {
  var localName = device.advertisement.localName;
  return (device.id === idOrLocalName || localName === idOrLocalName);
};

NobleDevice.Util.inherits(HRMDevice, NobleDevice);
NobleDevice.Util.mixin(HRMDevice, NobleDevice.DeviceInformationService);
NobleDevice.Util.mixin(HRMDevice, NobleDevice.HeartRateMeasumentService);
NobleDevice.Util.mixin(HRMDevice, NobleDevice.BatteryService);
NobleDevice.Util.mixin(HRMDevice, NobleDevice.CandleService);

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

function sleep(milliseconds) {
      var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
          break;
        }
      }
    }
HRMDevice.discover(function(device) {
  console.log('discovered: ' + device);

  device.on('disconnect', function() {
    console.log('disconnected!');
    process.exit(0);
  });
  device.on('onCandleBlowOnOFF', function(data) {
    console.log(">> EVENT update onCandleBlowOnOFF: ");
    console.log("0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]");
    console.log('BlowModeCode   = xxRRGGBBeFxxS1S2');
    console.log('BlowMode       = '+ bytesToHex(data));
    console.log(">>---------------------------");
  });

//  //new Buffer([0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]]);
  device.on('onCandleModeChange', function(data) {
    console.log(">> EVENT update onCandleModeChange: ");
    console.log("0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]");
    console.log('ModeCode     = xxRRGGBBeFxxS1S2');
    console.log('CurrentMode  = '+ bytesToHex(data));
    console.log(">>---------------------------");
  });

  device.on('onCandleColorChange', function(data) {
    console.log(">>>> EVENT update onCandleColorChange: ");
    console.log('ColorCode     = xxRRGGBB');
    console.log('CurrentColor  = '+ bytesToHex(data));
    console.log(">>>>---------------------------");
  });


  device.connectAndSetUp(function(callback) {
    console.log('connectAndSetUp');

    device.notifyCandleBlowOnOFF(function(counter) {
      console.log('notifyCandleBlowOnOFF - Blow/Off');
    });

    device.notifyCandleColorChange(function(counter) {
      console.log('notifyCandleColorChange');
    });
    device.readManufacturerName(function(error,data) {
      console.log('readManufacturerName '+data);
    });

    device.readModelNumber(function(error,data) {
      console.log('readModelNumber '+data);
    });

    device.readBatteryLevel(function(error,data) {
      console.log('readBatteryLevel '+data);
    });

    device.readCandle(function(error,data) {
      console.log('readCandle '+data);
    });

    /*
//#####Example Value | Result ------------- | ------------- 00000000 | led off ff000000 | full white 00ff0000 | full red 0000ff00 | full green 000000ff | full blue ffffffff | max brightness white + mixed white
//(new Buffer([0, 0, 0 , 0]), off
   device.setCurrentColor(new Buffer([255,255, 0 , 0]), function() {
          console.log("Set Color full blue");
        });

    device.getCurrentColor(function(error,data) {

       console.log('ColorCode     = xxRRGGBB');
       console.log('CurrentColor  = '+ bytesToHex(data));
     });



//Value: [white][red][green][blue][mode][00][speed][00]
    device.getMode(function(error,data) {
      console.log('ModeCode         = xxRRGGBBMMxxS1S2');
      console.log('CurrentModeCode  = '+ bytesToHex(data));
    });


    device.setModeCandleLight( function() {
     console.log("setModeCandleLight");
   });

   device.setModeCandleRainbow( function() {
    console.log("setModeCandleRainbow");
  });

  sleep(2000);
  // mode =01 = Fade, 02 = Jump RBG (rainbow), 03 = Fade RGB (rainbow), 04 = Candle Effect
  //new Buffer([0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]]);


  data = new Buffer([0, 255, 0, 0, 1,0,50,0 ]), // flashing red slow
  data = new Buffer([0, 255, 0, 0, 1,0,1,0 ]), // flashing red fast

  data = new Buffer([0, 255, 0, 0, 2,0,90,0 ]), // color jump

  data = new Buffer([0, 255, 0, 0, 3,0,90,0 ]), // Fading slow
  data = new Buffer([0, 255, 0, 0, 3,0,10,0 ]), // Fading fasterc

  data = new Buffer([0, 255, 0, 0, 4,0,10,0 ]), // red Candle
*/
  data = new Buffer([0, 0, 0, 2, 3,0,255,10 ]), // Fading slow

  device.setMode( data,function() {
   console.log("setMode to "+ bytesToHex(data));
 });


 //Value: [white][red][green][blue][mode][00][speed][00]
     device.getMode(function(error,data) {
       console.log('ModeCode         = xxRRGGBBMMxxS1S2');
       console.log('CurrentModeCode  = '+ bytesToHex(data));
     });

/*

  //bed6e76a  // dde1e983 //fffd

  // 04ffff04ffff04ffff04ffff0000 //fffe

  // 0000000000000000000100000000000000000000 //fff8
 data = new Buffer([00,00,00,00,00,00,00,00,00,01,00,00,00,00,00,00,00,00,00,00]), // Fading slow
   device.setFFFD( data,function() {
    console.log("setFFFD");
  });

   device.getFFFD(function(error,data) {

      console.log('getFFFD     = xxRRGGBB');
      console.log('getFFFD  = '+ bytesToHex(data));
    });


    device.setCandleOFF(function() {

       console.log('>>>setCandleOFF')
     });

var setname = "Markus";
data = new Buffer(setname)
 device.setName(data,function() {
   console.log('>>>>>> setName to '+setname);
   device.getName(function(error,data) {
     console.log('getName  = '+ data);
   });

 });

 device.getName(function(error,data) {
   console.log('getName  = '+ data);
 });


console.log(device)

    setInterval(function(){
                 r = Math.floor((Math.random() * 255) + 1);
                  g = Math.floor((Math.random() * 255) + 1);
                   b = Math.floor((Math.random() * 255) + 1);
                 device.setCurrentColor(new Buffer([0, r, g , b]), function() {
                  console.log("Set Color to r="+r+" g="+g+" b="+b);
                });

              }, 20000);
*/
                   });

});
