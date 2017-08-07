/************************************************************************
* Copyright 2017 IBM Corp. All Rights Reserved.
************************************************************************
*
* mvk@ca.ibm.com
* 20170804 - added multi connect function
*          - added the remote console on port 88
*          - added ipaddress
************************************************************************
*
* This porgram control multiple playbulb via
* mqqt using bluemix and watson iot platform
* it creates a connection for each detected playblub.
* Node: Its working with a mac ... does not work on a pi.
* I changed the name of the playbulbs to playbulbsxx where xx is 00,01 ...
* use correspondenting confign file with the name of the playbulb ...logviasocket
* playbulb01.json ,playbulb02.json 
* you can use the pipb.js program via :
* pipb plaublubg uuid a2 a3 NewName or use the function
* device.write('ff02', 'ffff',new Buffer(setname), function() {});
*
*************************************************************************
*
*/
const http = require('http');

const hostname = '127.0.0.1';
const port = 88;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


var
    // Local ip address that we're trying to calculate
    address
    // Provides a few basic operating-system related utility functions (built-in)
    ,os = require('os')
    // Network interfaces
    ,ifaces = os.networkInterfaces();

function externalIP()
{
    // Iterate over interfaces ...
    for (var dev in ifaces) {

        // ... and find the one that matches the criteria
        var iface = ifaces[dev].filter(function(details) {
            //console.log(iface);
          //  console.log(dev);

          return details.family === 'IPv4' && details.internal === false;
        });

        if(iface.length > 0) address = iface[0].address;
    }


    return address;
}

function internalIP()
{

var ifaces = os.networkInterfaces();

//console.log(JSON.stringify(ifaces, null, 4));

for (var iface in ifaces) {
  var iface = ifaces[iface];
  for (var alias in iface) {
    var alias = iface[alias];

  //  console.log(JSON.stringify(alias, null, 4));

    if ('IPv4' !== alias.family || alias.internal !== false) {
      //console.log("skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses");
      //console.log(alias);
      continue;
    }
    //console.log("Found ipaddress: " + alias.address);
    return alias.address;
  }
}
}


var intIP = internalIP();
var extIP = externalIP();
console.log("hostname = " +os.hostname());
console.log("External IP ="+extIP);
console.log("internal IP ="+intIP);

var iotf = require("../iotf/iotf-client");

  //setting the log level to trace. By default its 'warn'
  //mqttClient.log.setLevel('debug');

var NobleDevice = require('../lib/noble-device');
NobleDevice.Util = require('../lib/util');

var idOrLocalName = process.argv[2];

if (!idOrLocalName) {
  console.log("node program.js [BLE ID or local name]");
  console.log("Using playbulb?? as pattern and connect to all ");
//  process.exit(1);
}

var CandleDevice = function(device) {
  NobleDevice.call(this, device);
};

CandleDevice.is = function(device) {
  var localName = device.advertisement.localName;
  //console.log(device.advertisement);
  var Manu = ""
  try{
  Manu = new Buffer(device.advertisement.manufacturerData).toString('ascii');
}catch(e){
    var Manu = "No Manufacture Data"
}
  console.log(" id: " +device.id + " name: "+localName+ " Manu:"+Manu);
  return (Manu === "MIPOW" &&  (localName.includes("playbulb0") || localName  === "playbulb10"))
  //return (device.id === idOrLocalName || localName === idOrLocalName);
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


/************************************************************************
 * Discover BLE devices
 ************************************************************************/

//CandleDevice.discoverAll(function(device) {
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
    var localName =device._peripheral.advertisement.localName;
    console.log('ConnectAndSetUp - for '+localName);
    /************************************************************************
     * Connect to WIOTP
     ************************************************************************/
    console.log("IOTF start");

    var config = require("./"+localName+".json");
    var mqttClient = new iotf.IotfDevice(config);
    mqttClient.connect();
    //setting the log level to trace. By default its 'warn'
    mqttClient.log.setLevel('debug');
    mqttClient.on('connect', function(){
        var i=0;
        var candleName="";
        var batLevel="";
        var candleColor="";
        var rr="";
        var bb="";
        var gg="";
        var cmode;
        console.log("connected to IBM IOTF/Bluemix");
        setInterval(function function_name () {
          i++;

          device.candleName(function(error,data) {
            candleName = data;
          })
          device.getBatteryLevel(function(error,data) {
            batLevel =   parseInt(bytesToHex(data),16);
          })
          device.getCurrentColor(function(error,data) {
            candleColor = bytesToHex(data);
            rr =  parseInt(bytesToHex(data).substring(2,4),16);
            gg =  parseInt(bytesToHex(data).substring(4,6),16);
            bb =  parseInt(bytesToHex(data).substring(6,8),16);
         })

         //readCandleMode(

           device.read('ff02','fffb',function(error,data1) {
             cmode = bytesToHex(data1);
           });

               /************************************************************************
                * Send some device Information to WIOT and NODE-RED
                ************************************************************************/
          mqttClient.publish('ping', 'json', '{"value":'+i+',"mode":"'+cmode+'","batLevel":"'+batLevel+'","candleColor":"'+candleColor+'","candleRR":"'+rr+'","candleGG":"'+gg+'","candleBB":"'+bb+'","candleID":"'+device.id+'","internalIP":"'+intIP+ '","candleName":"'+candleName+ '"} ', 1);
          //  setCandleColor(0,0,i);
          //Text    mqttClient.publish('stt', 'json', '{"text":"Set candle to blue"}');
        },2000);


setInterval(function function_name () {
  console.log('>>>stopDiscoverAll');
  CandleDevice.stopDiscoverAll(function(error,data1){
//console.log('>>>stopDiscoverAll');
 });
},30000);
        //setCandleBlue();
    });

    mqttClient.on('disconnect', function(){
      console.log('Disconnected from IoTF');
    });


        /************************************************************************
         * WAITING for actions
         ************************************************************************/
    mqttClient.on("command", function (commandName,format,payload,topic) {

    console.log("Command:", commandName);
    console.log("payload = "+JSON.parse(payload));
    myjson = JSON.parse(payload);
//  console.log("payload = "+JSON.parse(payload).rr);
    if(commandName === "setModeCandleLight") {
        setModeCandleLight();
      }else if(commandName === "setCandleMode") {
            setCandleMode(myjson.rr,myjson.gg,myjson.bb,myjson.mode,myjson.speed1,myjson.speed1);
      }else if(commandName === "setColorBlue") {
            setCandleBlue();
        } else if(commandName === "setColor") {
            setCandleColor(myjson.rr,myjson.gg,myjson.bb);
        }else {
            console.log("Command not supported.. " + commandName);
        }
    }); //Command

    ////***

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
      console.log('ColorCode       = xxRRGGBB');
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
           console.log("Set Color to RED");
         });
}

function setCandleOn(){
      // write color
          device.write('ff02','fffc',new Buffer([0, 0, 0, 255]), function() {
           console.log("Set Candle to On");
         });
}

function setCandleOff(){
      // write color
          device.write('ff02','fffc',new Buffer([0, 0, 0, 0]), function() {
           console.log("Set Candle to Off");
         });
}



})
