var detection = require('./detection.js');
var mraa = require('mraa');
var ON_DEATH = require('death');
var noisebridge = new detection.Bathroom();
noisebridge.isOn(true);
console.log(noisebridge.currentSession);
noisebridge.isOn(false);
console.log(noisebridge.currentSession);
setTimeout(function () { console.log('Past Sessions: ' + noisebridge.pastSessions); }, noisebridge.minTimeGap + 500);
var switchGPIO = new mraa.Gpio(6);
switchGPIO.dir(mraa.DIR_IN);
pollSwitch();
function pollSwitch() {
    var status = switchGPIO.read();
    console.log('status: ', status);
    noisebridge.isOn(status == true);
    console.log(noisebridge.currentSession);
    setTimeout(pollSwitch, 1000);
}
ON_DEATH(function () {
    console.log(noisebridge.pastSessions);
    process.exit();
});
