declare var require: any;
var FlakeIdGen = require('flake-idgen')
	, intFormat = require('biguint-format')
	, idGenerator = new FlakeIdGen; // h/t Tom Pawlak's blog post

var winston = require('winston');

var ForerunnerDB = require('forerunnerdb');
var fdb = new ForerunnerDB();
var db = fdb.db("game-of-thrones");
db.presist.dataDir("./configData");


// data: 2 variables: last_start and last_stop
// db with start/stop times

function generateId() {
	let id: number = intFormat(idGenerator.next(), 'dec');
	return id;
}

interface insertResult {
	inserted: 	any[];
	failed: 	any[];
}
function insertHandler(result: insertResult) {
	winston.debug(result.inserted.length + " objects stored in the DB")
	if (result.failed.length > 0) {
		winston.warn(result.failed.length + " objects failed to be stored!")
	}
}

export class Session {
	startTime: Date;
	stopTime: Date; 
	running: boolean;
	id: number = generateId();

	start = function() {
		this.startTime = new Date();
		this.running = true;
	} 

	stop = function(stopTime?: Date) {
		this.stopTime = stopTime || new Date;
		this.running = false;
	}

	restart = function() {
		this.running = true;
	}

	constructor() {
		this.start();
		winston.debug('New Session, ID: ' + this.id)
	}

}

function bathroomCleanup(bathroom: Bathroom, id: number){
	if((bathroom.currentSession.id == id) && !(bathroom.currentSession.running)) {
		bathroom._finalStop();
	}
};

export class Bathroom {
	lastStartTime:	Date = undefined;
	lastStopTime:	Date = undefined;
	pastSessions:	Session[] = [];
	currentSession:	Session = null;
	minTimeGap:		number = 5000; // minimum time (in milliseconds) to register a new session
	sessionDB: 		any;

	constructor(collectionName?: string){
		let collnameFallback: string = db.collection(collectionName || "Bathroom");
		winston.info("New Bathroom created. Collection Name: " + collnameFallback);
		this.sessionDB = db.collection(collnameFallback, 
			{primaryKey: "id"}
			);
		this.sessionDB.load();
	}

	inUse = function() {
		if(this.currentSession){
			return this.currentSession.running;
		} else {
			return false;
		}
	}

	_rawStart = function() {
		if (this.currentSession !== null) {
			throw('A session is currently underway!');
		}
		this.currentSession = new Session();
		this.lastStartTime = new Date();
	}
	
	start = function() {
		/* starts a session */
		let now: number = new Date().getTime();
		let thenDate: Date = this.lastStopTime || new Date(0);
		let then: number = thenDate.getDate();
		if (now - (then || 0) < this.minTimeGap) {
			this.currentSession.restart();
		} else {
			this._rawStart();
		}
	}

	_commitDB = function(session: Session) {
		this.sessionDB.insert({
			id: 		session.id,
			startTime: 	fdb.make(session.startTime),
			stopTime:	fdb.make(session.stopTime)

		}, insertHandler)
		this.sessionDB.save() // 2 async functions,
			// no guarantee that the last object was saved.
	}

	_finalStop = function() {
		/* call after you're sure that it's over */
		this.pastSessions.push(this.currentSession)
		this._commitDB(this.currentSession)
		this.currentSession = null;
	}

	stop = function() {
		/* Ends a session. Waits until the timegap expires to do final checks.*/
		let now: Date = new Date();
		this.lastStopTime = now;
		this.currentSession.stop(now);
		let sessionIDToStop: number = this.currentSession.id;

		setTimeout(bathroomCleanup(this, sessionIDToStop), this.minTimeGap);
	}

	isOn = function(on: boolean) {
		/* if the pin is on and there's not a session, start.
			if the pin is off and there is a session, stop.
		*/
		let isRunning: boolean = (this.currentSession || {'running': false}).running
		if (on && !isRunning){
			this.start();
		}
		if (!on && isRunning) {
			this.stop();
		}
	}

}
