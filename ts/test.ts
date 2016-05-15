declare var require: any;
declare var process: any;
var detection = require('./detection.js');
var mraa = require('mraa');
var ON_DEATH = require('death');
var argv = require('yargs').argv;
var winston = require('winston');

var gpioPin: number = argv.p || 6;
winston.info("GPIO Pin Number " + gpioPin);

var noisebridge = new detection.Bathroom();
noisebridge.isOn(true);
winston.debug(noisebridge.currentSession)
noisebridge.isOn(false);
winston.debug(noisebridge.currentSession)
setTimeout(function(){winston.debug('Past Sessions: ' + noisebridge.pastSessions)}, noisebridge.minTimeGap + 500);

var switchGPIO = new mraa.Gpio(gpioPin);
switchGPIO.dir(mraa.DIR_IN);

pollSwitch();

function pollSwitch(){
	var status = switchGPIO.read();
	winston.debug('status: ', status)
	noisebridge.isOn(status == true);
	if (noisebridge.inUse()) {
		winston.debug('Current Session ID: ' + noisebridge.currentSession.id);
	} else {
		winston.debug('No Current Session');
	}
	setTimeout(pollSwitch, 1000);
}

ON_DEATH(function(){
	winston.debug(noisebridge.pastSessions); process.exit();
}); 