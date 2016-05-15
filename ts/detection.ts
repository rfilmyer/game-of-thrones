declare var require: any;
var FlakeIdGen = require('flake-idgen')
	, intFormat = require('biguint-format')
	, idGenerator = new FlakeIdGen; // h/t Tom Pawlak's blog post

// data: 2 variables: last_start and last_stop
// db with start/stop times

function generateId() {
	let id: number = intFormat(idGenerator.next(), 'dec');
	return id;
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
	}

}

function bathroomCleanup(bathroom: Bathroom, id: number){
	if((bathroom.currentSession.id == id) && !(bathroom.currentSession.running)) {
		bathroom.rawStop();
	}
};

export class Bathroom {
	lastStartTime:	Date = undefined;
	lastStopTime:	Date = undefined;
	pastSessions:	Session[] = [];
	currentSession:	Session = null;
	minTimeGap:		number = 100; // minimum time (in milliseconds) to register a new session

	rawStart = function() {
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
			this.rawStart();
		}
	}

	rawStop = function() {
		/* call after you're sure that it's over */
		this.pastSessions.push(this.currentSession)
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
