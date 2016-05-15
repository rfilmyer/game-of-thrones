/*************************
Detection.ts

The interface between the pressure sensor and the website backend.

This module detects state changes in the pressure sensor and
    logs them to the database, stored in /db.

This module exports a single class: Bathroom

Bathrooms:
    Bathrooms represent a single room/game/toilet.

    Creation:
    Bathroom(collectionName, timeout?): Creates a new Bathroom instance.
        collectionName (string): The name of the forerunnerDB collection where data can be stored.
        timeout (number): If a session stops and starts within this timeout,
            it will be considered an accidental button unpress.

    Methods:
    Bathrooms have 3 externally-usable methods, although
        only `isOn` needs to be used in practice.

        Bathroom.isOn(state): Sets the state of the pressure switch,
            creating or ending a session in the process.
            state: Whether the switch is pressed or unpressed

        Bathroom.start(): Starts or Restarts a session, depending on
            whether it's started within the timeout.

        Bathroom.stop(): Ends a bathroom session. After timeout,
            writes a record to the database and triggers a commit if the
            session hasn't been restarted

    Properties:
    Bathrooms can show state and details about the current session:

        Bathroom.inUse (bool): Shows whether there is an active session in this bathroom.

        Bathroom.currentSession (Session): Shows details about the current session.
            See information about the Session object below

        Bathroom.pastSessions (Array<Session>): An array of all the previous Session objects.
            May be deprecated, since the DB has all the necessary information

Sessions (internal class):
    Sessions correspond to a current use of the Bathroom.

    Properties:
    Sessions have properties about its current state:

        Session.id (number): The session's ID number, which uses `flake`

        Session.startTime (Date): When this session started

        Session.stopTime (Date): The last time this session stopped.
            If a session was stopped and restarted, will show the last stop time.

        Session.running (bool): Whether the session is in progress.

Database Entries:
    This file stores database entries that are a subset of Session objects.
    These entries have the following properties:
        id (number), startTime(Date), stopTime(Date).

*************************/
"use strict";
var FlakeIdGen = require('flake-idgen'), intFormat = require('biguint-format'), idGenerator = new FlakeIdGen; // h/t Tom Pawlak's blog post
var winston = require('winston');
var ForerunnerDB = require('forerunnerdb');
var fdb = new ForerunnerDB();
var db = fdb.db("game-of-thrones");
db.persist.dataDir("./db");
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
        var collnameFallback = collectionName || "Bathroom";
        winston.info("New Bathroom created. Collection Name: " + collnameFallback);
        this.sessionDB = db.collection(collnameFallback, { primaryKey: "id" });
        this.sessionDB.load();
    }
    return Bathroom;
}());
exports.Bathroom = Bathroom;
