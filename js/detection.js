"use strict";
var FlakeIdGen = require('flake-idgen'), intFormat = require('biguint-format'), idGenerator = new FlakeIdGen; // h/t Tom Pawlak's blog post
var winston = require('winston');
var ForerunnerDB = require('forerunnerdb');
var fdb = new ForerunnerDB();
var db = fdb.db("game-of-thrones");
db.presist.dataDir("./configData");
// data: 2 variables: last_start and last_stop
// db with start/stop times
function generateId() {
    var id = intFormat(idGenerator.next(), 'dec');
    return id;
}
function insertHandler(result) {
    winston.debug(result.inserted.length + " objects stored in the DB");
    if (result.failed.length > 0) {
        winston.warn(result.failed.length + " objects failed to be stored!");
    }
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
        winston.debug('New Session, ID: ' + this.id);
    }
    return Session;
}());
exports.Session = Session;
function bathroomCleanup(bathroom, id) {
    if ((bathroom.currentSession.id == id) && !(bathroom.currentSession.running)) {
        bathroom._finalStop();
    }
}
;
var Bathroom = (function () {
    function Bathroom(collectionName) {
        this.lastStartTime = undefined;
        this.lastStopTime = undefined;
        this.pastSessions = [];
        this.currentSession = null;
        this.minTimeGap = 5000; // minimum time (in milliseconds) to register a new session
        this.inUse = function () {
            if (this.currentSession) {
                return this.currentSession.running;
            }
            else {
                return false;
            }
        };
        this._rawStart = function () {
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
                this._rawStart();
            }
        };
        this._commitDB = function (session) {
            this.sessionDB.insert({
                id: session.id,
                startTime: fdb.make(session.startTime),
                stopTime: fdb.make(session.stopTime)
            }, insertHandler);
            this.sessionDB.save(); // 2 async functions,
            // no guarantee that the last object was saved.
        };
        this._finalStop = function () {
            /* call after you're sure that it's over */
            this.pastSessions.push(this.currentSession);
            this._commitDB(this.currentSession);
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
        var collnameFallback = db.collection(collectionName || "Bathroom");
        winston.info("New Bathroom created. Collection Name: " + collnameFallback);
        this.sessionDB = db.collection(collnameFallback, { primaryKey: "id" });
        this.sessionDB.load();
    }
    return Bathroom;
}());
exports.Bathroom = Bathroom;
