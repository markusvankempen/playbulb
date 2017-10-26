/************************************************************************
* Copyright 2016 IBM Corp. All Rights Reserved.
************************************************************************
*
* mvk@ca.ibm.com
* adjustemts for SNP Workshop - 20171101
************************************************************************
*
* This porgram controls a playbulb is use the hostname to look for a correspondenting
* wiotp config file like playbulb00.json .
*
* Event for BlowOnOFF, Color and Mode change a added
*
* Depency are the lib file from noble-device and the candle-service.js in lib
*
************************************************************************
*/
// Require child_process
var exec = require('child_process').exec;

// Create shutdown function
function shutdown(callback){
    exec('shutdown -r now', function(error, stdout, stderr){ callback(stdout); });
}


  var iotf = require("../iotf/iotf-client");

/// IP address

  var
      // Local ip address that we're trying to calculate
      address
      // Provides a few basic operating-system related utility functions (built-in)
      ,os = require('os')
      // Network interfaces
      ,ifaces = os.networkInterfaces();

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
  var myhostname = "playbulb00" ;//os.hostname();

  console.log("hostname = " +myhostname);
  console.log("internal IP ="+intIP);

// WEB server

var http = require('http'),
    fs = require('fs'),
    // NEVER use a Sync function except at start-up!
    index = fs.readFileSync(__dirname + '/logviasocket.html');

    const hostname = '127.0.0.1';
    const port = 8881;

// Send index.html to all requests
var app = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(index);
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);

// Send current time to all connected clients
function sendTime() {
    io.emit('clearance', { time: new Date().toJSON() });
    log(io,"Helo There");
}
function log(io,data){
     console.log(data);
     io.emit('message', { time: new Date().toJSON() ,text: data});
}
// Send current time every 10 secs
//setInterval(sendTime, 10000);

// Emit welcome message on connection
io.on('connection', function (socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    socket.emit('welcome', { message: 'Welcome! You are '+myhostname, id: socket.id });

    socket.on('receiveClerance', function (data) {
        log(socket,data);
        // Reboot computer
       shutdown(function(output){
           log(output);
        });
    });
});



app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
//// BLE

var NobleDevice = require('../lib/noble-device');
NobleDevice.Util = require('../lib/util');

var idOrLocalName = process.argv[2];

if (!idOrLocalName) {
    myhostname = "playbulb00" ;
  console.log("node program.js [BLE ID or local name] will use hostname ="+myhostname);
//  process.exit(1);
}else{


}

var CandleDevice = function(device) {
  NobleDevice.call(this, device);
};

CandleDevice.is = function(device) {
  var localName = device.advertisement.localName;
  log(io," id: " +device.id + " name: "+localName);
  return (device.id === idOrLocalName || localName === idOrLocalName || localName === myhostname  );
};

NobleDevice.Util.inherits(CandleDevice, NobleDevice);

NobleDevice.DeviceInformationService = require('../lib/device-information-service');
NobleDevice.BatteryService = require('../lib/battery-service');
NobleDevice.CandleService = require('../lib/candle-service');

NobleDevice.Util.mixin(CandleDevice, NobleDevice.DeviceInformationService);
NobleDevice.Util.mixin(CandleDevice, NobleDevice.BatteryService);
NobleDevice.Util.mixin(CandleDevice, NobleDevice.CandleService);


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
var cmode=""
var mqttClient = null;
var ib=0;
var ic=0;
var im=0;
var modeno=0;
var s1=0;
var s2=0;

/************************************************************************
 * Discover BLE devices
 ************************************************************************/

CandleDevice.discover(function(device) {
  console.log('discovered: ' + device);

  device.on('disconnect', function() {
    log('disconnected!');
    process.exit(0);
  });

  device.on('onCandleBlowOnOFF', function(data) {
    console.log(">> EVENT update onCandleBlowOnOFF: ");
    console.log("0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]");
    console.log('BlowModeCode   = xxRRGGBBeFxxS1S2');
    console.log('BlowMode       = '+ bytesToHex(data));
    console.log(">>---------------------------");
    ib++;
    modecode = bytesToHex(data)
    rr =  parseInt(modecode.substring(2,4),16);
    gg =  parseInt(modecode.substring(4,6),16);
    bb =  parseInt(modecode.substring(6,8),16);


    status = "off"
    if (rr+gg+bb > 0)
          status = "on"

    modeno =  parseInt(modecode.substring(8,10),16);
    var mqmsg  ='{"event":"onCandleBlowOnOFF","status":"'+status+'","value":'+ib+',"mode":'+modeno+',"modecode":"'+modecode+'","candleRR":"'+rr+'","candleGG":"'+gg+'","candleBB":"'+bb+'","candleID":"'+device.id+'","candleName":"'+candleName+ '"} ';

    log(io,mqmsg);

    if( mqttClient != null)
    {
              mqttClient.publish('BlowOnOff', 'json', mqmsg,1);
    }

  });

//  //new Buffer([0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]]);
  device.on('onCandleModeChange', function(data) {
    console.log(">> EVENT update onCandleModeChange: ");
    console.log("0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]");
    console.log('ModeCode     = xxRRGGBBeFxxS1S2');
    console.log('CurrentMode  = '+ bytesToHex(data));
    console.log(">>---------------------------");

    im++;
    modecode = bytesToHex(data)
    rr =  parseInt(modecode.substring(2,4),16);
    gg =  parseInt(modecode.substring(4,6),16);
    bb =  parseInt(modecode.substring(6,8),16);
    modeno =  parseInt(cmode.substring(8,10),16);
    s1 =  parseInt(cmode.substring(10,12),16);
    s2 =  parseInt(cmode.substring(12,14),16);

    status = "off"
    if (rr+gg+bb > 0)
          status = "on"

    modeno =  parseInt(modecode.substring(8,10),16);
  //  var mqmsg  ='{"event":"onCandleModeChange","status":"'+status+'","value":'+im+',"modecode":"'+modecode+'","candleRR":'+rr+',"candleGG":'+gg+',"candleBB":'+bb+',"candleID":"'+device.id+'","candleName":"'+candleName+ '"} ';
    var mqmsg  ='{"event":"onCandleModeChange","value":'+im+',"status":"'+status+'","modeno":'+modeno+',"modes1":'+s1+',"modes2":'+s2+',"mode":"'+cmode+'","batLevel":'+batLevel+',"candleColor":"'+candleColor+'","candleRR":'+rr+',"candleGG":'+gg+',"candleBB":'+bb+',"ipAddr":"'+intIP+'","candleID":"'+device.id+'","candleName":"'+candleName+ '"} ';

    log(io,mqmsg);

    if( mqttClient != null)
    {
              mqttClient.publish('BlowOnOff', 'json', mqmsg,1);
    }


  });

  device.on('onCandleColorChange', function(data) {
    console.log(">>>> EVENT update onCandleColorChange: ");
    console.log('ColorCode     = xxRRGGBB');
    console.log('CurrentColor  = '+ bytesToHex(data));
    console.log(">>>>---------------------------");

    ic++;
    modecode = bytesToHex(data)
    rr =  parseInt(modecode.substring(2,4),16);
    gg =  parseInt(modecode.substring(4,6),16);
    bb =  parseInt(modecode.substring(6,8),16);
    status = "off"
    if (rr+gg+bb > 0)
          status = "on"

    modeno =  parseInt(modecode.substring(8,10),16);
    var mqmsg  ='{"event":"onCandleColorChange","status":"'+status+'","value":'+ic+',"modecode":"'+modecode+'","candleRR":'+rr+',"candleGG":'+gg+',"candleBB":'+bb+',"candleID":"'+device.id+'","candleName":"'+candleName+ '"} ';

    log(io,mqmsg);

    if( mqttClient != null)
    {
              mqttClient.publish('BlowOnOff', 'json', mqmsg,1);
    }

  });

  device.connectAndSetUp(function(callback) {
    console.log('ConnectAndSetUp');
    CandleDevice.stopScanning();

    getCandleInfos();

    device.notifyCandleBlowOnOFF(function(counter) {
      console.log('notifyCandleBlowOnOFF - Blow/Off');
    });

    device.notifyCandleColorChange(function(counter) {
      console.log('notifyCandleColorChange');
    });


    var config = require("./"+myhostname+".json");
    mqttClient = new iotf.IotfDevice(config);
    //setting the log level to trace. By default its 'warn'
    mqttClient.log.setLevel('debug');

    /************************************************************************
     * Connect to WIOTP
     ************************************************************************/
    console.log("IOTF start with "+myhostname);
    mqttClient.connect();

    mqttClient.on('connect', function(){
        var i=0;
        log(io,"connected to IBM IOTF/Bluemix");

                  setCandleColor(0,0,0);//  setCandleOff();
                    sleep(250);
                  setCandleColor(0,0,255);//  setCandleBlue();
                    sleep(250);
                  setCandleColor(0,0,0);//  setCandleOff();
                    sleep(250);
                  setCandleColor(0,255,0);//setCandleGreen();

                  /************************************************************************
                   * Send some device Information to WIOT and NODE-RED
                   ************************************************************************/
        // periodic update

        setInterval(function function_name () {
          i++;

          getCandleInfos()

          status = "off"
          if (rr+gg+bb > 0)
                status = "on"

          if( isNaN(modeno) )
          modeno=0

         var mqmsg  ='{"event":"ping","value":'+i+',"status":"'+status+'","modeno":'+modeno+',"modes1":'+s1+',"modes2":'+s2+',"mode":"'+cmode+'","batLevel":'+batLevel+',"candleColor":"'+candleColor+'","candleRR":'+rr+',"candleGG":'+gg+',"candleBB":'+bb+',"ipAddr":"'+intIP+'","candleID":"'+device.id+'","candleName":"'+candleName+ '"} ';
        mqttClient.publish('ping', 'json', mqmsg,1);
         log(io,mqmsg);
          //  setCandleColor(0,0,i);
          //Text    mqttClient.publish('stt', 'json', '{"text":"Set candle to blue"}');
        },5000);

        //setCandleBlue();
    });

    mqttClient.on('disconnect', function(){
      log('Disconnected from IoTF');
    });


        /************************************************************************
         * WAITING for actions
         ************************************************************************/
    mqttClient.on("command", function (commandName,format,payload,topic) {

    console.log("Command:", commandName);
    log(io,"Comand received with payload = "+JSON.parse(payload));
    myjson = JSON.parse(payload);
    mqttClient.publish('confirmation', 'json', myjson,1);
    log(io,"Command:" + commandName +" Payload:"+myjson);
//  console.log("payload = "+JSON.parse(payload).rr);
    if(commandName === "setModeCandleLight") {
          setCandleMode(0,255,255,4,10,0);
      }else if(commandName === "setCandleMode") {
            setCandleMode(myjson.rr,myjson.gg,myjson.bb,myjson.mode,myjson.speed1,myjson.speed2);
      }else if(commandName === "setColorBlue") {
            setCandleColor(0,0,255);
        } else if(commandName === "setColor") {
            setCandleColor(myjson.rr,myjson.gg,myjson.bb);
        }else {
            log(io,"Command not supported.. " + commandName);
        }
    }); //Command

    ////***

  });//connectAndSetUp
/*
**
*/
function getCandleInfos()
{

      device.readManufacturerName(function(error,data) {
        console.log('readManufacturerName '+data);
      });

      device.readModelNumber(function(error,data) {
        console.log('readModelNumber '+data);
      });

  device.getName(function(error,data) {
  //  console.log('getName  = '+ data);
      candleName = data;
  });

  device.readBatteryLevel(function(error,data) {
    batLevel=data;
  });


  //00 00 00 00 ff 00 0a 0a
 device.getCurrentColor(function(error,data) {
  //  console.log('ColorCode     = xxRRGGBB');
  //  console.log('CurrentColor  = '+ bytesToHex(data));
    candleColor = bytesToHex(data);
    rr =  parseInt(bytesToHex(data).substring(2,4),16);
    gg =  parseInt(bytesToHex(data).substring(4,6),16);
    bb =  parseInt(bytesToHex(data).substring(6,8),16);

  });

 //readCandleMode(
 device.getMode(function(error,data) {
  // console.log('ModeCode         = xxRRGGBBMMxxS1S2');
  // console.log('CurrentMode      = '+ bytesToHex(data));
        cmode = bytesToHex(data);
        modeno =  parseInt(cmode.substring(8,10),16);
        s1 =  parseInt(cmode.substring(10,12),16);
        s2 =  parseInt(cmode.substring(12,14),16);
 });

}
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
         oldmodedata= data;
         console.log("setMode to "+bytesToHex(data));
       });

       //Value: [white][red][green][blue][mode][00][speed][00]
        //   device.getMode(function(error,data) {
      //       console.log('ModeCode         = xxRRGGBBMMxxS1S2');
        //     console.log('CurrentMode      = '+ bytesToHex(data));
        //   });
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


})
