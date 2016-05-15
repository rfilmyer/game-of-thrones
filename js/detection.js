"use strict";
var FlakeIdGen = require('flake-idgen'), intFormat = require('biguint-format'), idGenerator = new FlakeIdGen; // h/t Tom Pawlak's blog post
// data: 2 variables: last_start and last_stop
// db with start/stop times
function generateId() {
    var id = intFormat(idGenerator.next(), 'dec');
    return id;
}
var Session = (function () {
    function Session() {
        this.id = generateId();
        this.start = function () {
            this.startTime = new Date();
            this.running = true;
        };
        this.stop = function (stopTime) {
            this.stopTime = stopTime || new Date;
            this.running = false;
        };
        this.restart = function () {
            this.running = true;
        };
        this.start();
    }
    return Session;
}());
exports.Session = Session;
function bathroomCleanup(bathroom, id) {
    if ((bathroom.currentSession.id == id) && !(bathroom.currentSession.running)) {
        bathroom.rawStop();
    }
}
;
var Bathroom = (function () {
    function Bathroom() {
        this.lastStartTime = undefined;
        this.lastStopTime = undefined;
        this.pastSessions = [];
        this.currentSession = null;
        this.minTimeGap = 100; // minimum time (in milliseconds) to register a new session
        this.rawStart = function () {
            if (this.currentSession !== null) {
                throw ('A session is currently underway!');
            }
            this.currentSession = new Session();
            this.lastStartTime = new Date();
        };
        this.start = function () {
            /* starts a session */
            var now = new Date().getTime();
            var thenDate = this.lastStopTime || new Date(0);
            var then = thenDate.getDate();
            if (now - (then || 0) < this.minTimeGap) {
                this.currentSession.restart();
            }
            else {
                this.rawStart();
            }
        };
        this.rawStop = function () {
            /* call after you're sure that it's over */
            this.pastSessions.push(this.currentSession);
            this.currentSession = null;
        };
        this.stop = function () {
            /* Ends a session. Waits until the timegap expires to do final checks.*/
            var now = new Date();
            this.lastStopTime = now;
            this.currentSession.stop(now);
            var sessionIDToStop = this.currentSession.id;
            setTimeout(bathroomCleanup(this, sessionIDToStop), this.minTimeGap);
        };
        this.isOn = function (on) {
            /* if the pin is on and there's not a session, start.
                if the pin is off and there is a session, stop.
            */
            var isRunning = (this.currentSession || { 'running': false }).running;
            if (on && !isRunning) {
                this.start();
            }
            if (!on && isRunning) {
                this.stop();
            }
        };
    }
    return Bathroom;
}());
exports.Bathroom = Bathroom;
