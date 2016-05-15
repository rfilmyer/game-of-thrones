var detection = require('./detection.js');
var mraa = require('mraa');
var ON_DEATH = require('death');
var argv = require('yargs').argv;
var winston = require('winston');
if (argv.v) {
    winston.level = 'debug';
}
if (argv.vv) {
    winston.level = 'silly';
}
var gpioPin = argv.p || 6;
winston.info("GPIO Pin Number " + gpioPin);
var noisebridge = new detection.Bathroom();
noisebridge.isOn(true);
winston.debug(noisebridge.currentSession);
noisebridge.isOn(false);
winston.debug(noisebridge.currentSession);
setTimeout(function () { winston.debug('Past Sessions: ', noisebridge.pastSessions.map(getIDofElement)); }, noisebridge.minTimeGap + 500);
setTimeout(function () { winston.debug('Session IDs in DB: ', noisebridge.sessionDB.find().map(getIDofElement)); }, noisebridge.minTimeGap + 500);
if (!argv.g) {
    var switchGPIO = new mraa.Gpio(gpioPin);
    switchGPIO.dir(mraa.DIR_IN);
    pollSwitch();
}
else {
    winston.info('Skipping GPIO');
}
function pollSwitch() {
    var status = switchGPIO.read();
    winston.debug('status: ', status);
    noisebridge.isOn(status == true);
    if (noisebridge.inUse()) {
        winston.debug('Current Session ID: ' + noisebridge.currentSession.id);
    }
    else {
        winston.debug('No Current Session');
    }
    setTimeout(pollSwitch, 1000);
}
function getIDofElement(elem) {
    return elem.id;
}
ON_DEATH(function () {
    winston.debug(noisebridge.pastSessions);
    process.exit();
});
