var BATTERY_UUID                    = 'ff02'; //"2a37")
var BATTERY_LEVEL_UUID              = '2a37'; // blow
var BATTERY_BLOWOUT                = '2a37'; // blow
var CANDLE_UUID                     = 'ff02';
var COLOR_READ                      = 'fffc';
var COLOR_WRITE                     = 'fffc';
var COLOR_CHANGE_UUID               =  '0001016d10211e19b2300025b00a5a5';
var COLOR_CHANGE                    =  '00001014d10211e19b2300025b00a5a5';
var MODE_UUID                      = 'ff02';
var MODE_READ                      = 'fffb';
var MODE_WRITE                     = 'fffb';
var MODE_CHANGE                    = 'fffb';
var NAME_UUID                      = 'ff02';
var NAME_READ                      = 'ffff';
var NAME_WRITE                     = 'ffff';
var FFFD_UUID                      = 'ff02';
var FFFD                           = 'fffe'; //fffd //fffe //fff8


function CandleService() {
}

CandleService.prototype.readCandle = function(callback) {
  this.readDataCharacteristic(BATTERY_UUID, BATTERY_LEVEL_UUID, callback);
};

CandleService.prototype.onCandleBlowOnOFF = function (data) {
  this.emit('onCandleBlowOnOFF', data);
};

CandleService.prototype.notifyCandleBlowOnOFF = function (callback) {
  this.onCandleChangeBinded       = this.onCandleBlowOnOFF.bind(this);
  this.notifyCharacteristic(BATTERY_UUID, BATTERY_LEVEL_UUID, true, this.onCandleChangeBinded, callback);
};
CandleService.prototype.getCurrentColor = function(callback) {
  this.readDataCharacteristic('ff02', 'fffc', callback);
};

CandleService.prototype.setCurrentColor = function(data,callback) {
  this.setModeReset();
  this.writeDataCharacteristic('ff02', 'fffc', data, callback);
  this.emit('onCandleColorChange', data);
};

CandleService.prototype.setCandleOFF = function(callback) {
    data = new Buffer([0, 0, 0, 0 ])
    this.writeDataCharacteristic('ff02', 'fffc', data, callback);
    this.emit('onCandleColorChange', data);
};


CandleService.prototype.getFFFD = function(callback) {
  this.readDataCharacteristic('ff02', FFFD, callback);
};

CandleService.prototype.setFFFD = function(data,callback) {
  this.writeDataCharacteristic('ff02', FFFD, data, callback);
  this.emit('onCandleColorChange', data);
};

CandleService.prototype.setModeReset = function() {
  data = new Buffer([0, 0, 0, 0, 0,0,0,0]);
  this.writeDataCharacteristic(MODE_UUID , MODE_CHANGE,  data);
};

CandleService.prototype.setMode = function(data,callback) {
  this.writeDataCharacteristic(MODE_UUID , MODE_CHANGE,  data, callback);
  this.emit('onCandleModeChange', data);
};


CandleService.prototype.getMode = function(callback) {
  this.readDataCharacteristic(MODE_UUID , MODE_READ , callback);
};

CandleService.prototype.getName  = function(callback) {
  this.readDataCharacteristic(NAME_UUID , NAME_READ , callback);
};

CandleService.prototype.setName  = function(data,callback) {
  this.emit('onCandleNameChange', data);
  this.writeDataCharacteristic(NAME_UUID , NAME_WRITE , data, callback);
};

// mode =01 = Fade, 02 = Jump RBG (rainbow), 03 = Fade RGB (rainbow), 04 = Candle Effect
//new Buffer([0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]]);

CandleService.prototype.setModeCandleLight = function(callback) {
  data = new Buffer([0, 255, 255, 0, 4,0,5,0 ]),
  this.emit('onCandleModeChange', data);
  this.writeDataCharacteristic(MODE_UUID , MODE_CHANGE,  data, callback);
};

// mode =01 = Fade, 02 = Jump RBG (rainbow), 03 = Fade RGB (rainbow), 04 = Candle Effect
//new Buffer([0, r, g, b, effect, 0, speedBytes[0], speedBytes[1]]);
CandleService.prototype.setModeCandleRainbow = function(callback) {
  //setCandleMode (r,g,b,mode,speed1,speed2){

  data = new Buffer([255,0,255,02,0,95,0]);
  this.emit('onCandleModeChange', data);
  this.writeDataCharacteristic(MODE_UUID , MODE_CHANGE,  data, callback);
};

CandleService.prototype.setModeCandleFlash = function(callback) {
  data = new Buffer([0,0,255,0,0,19,0]);
  this.emit('onCandleModeChange', data);
  this.writeDataCharacteristic(MODE_UUID , MODE_CHANGE,  data, callback);
};

CandleService.prototype.setModeCandleFade = function(callback) {
  data = new Buffer([0, 255, 255, 0, 3,0,5,0 ]),
  this.emit('onCandleModeChange', data);
  this.writeDataCharacteristic(MODE_UUID , MODE_CHANGE,  data, callback);
};



CandleService.prototype.onCandleColorChange = function (data) {
  this.emit('onCandleColorChange', data);
};

CandleService.prototype.notifyCandleColorChange = function (callback) {
  this.onCandleColorChangeBinded       = this.onCandleColorChange.bind(this);
  this.notifyCharacteristic(COLOR_CHANGE_UUID , COLOR_CHANGE, true, this.onCandleColorChangeBinded, callback);
};

CandleService.prototype.onCandleModeChange = function (data) {
  this.emit('onCandleModeChange', data);
};

CandleService.prototype.notifyCandleModeChange  = function (callback) {
  this.onCandleModeChangeBinded       = this.onCandleModeChange.bind(this);
  this.notifyCharacteristic(MODE_UUID , MODE_CHANGE, true, this.onCandleModeChangeBinded, callback);
};

CandleService.prototype.unnotifyCandle  = function (callback) {
  this.notifyCharacteristic(BATTERY_UUID, BATTERY_LEVEL_UUID, false, this.onCandleChangeBinded, callback);
};

module.exports = CandleService;
