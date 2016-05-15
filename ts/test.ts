declare var require: any;
var detection = require('./detection.js');

var noisebridge = new detection.Bathroom();
noisebridge.isOn(true);
console.log(noisebridge.currentSession)
noisebridge.isOn(false);
console.log(noisebridge.currentSession)
setTimeout(function(){console.log('Past Sessions: ' + noisebridge.pastSessions)}, noisebridge.minTimeGap + 500);