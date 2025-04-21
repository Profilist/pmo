export namespace main {
	
	export class SessionRecord {
	    taskName: string;
	    startTime: string;
	    endTime: string;
	    duration: number;
	    completedCycles: number;
	    isCompleted: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SessionRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.taskName = source["taskName"];
	        this.startTime = source["startTime"];
	        this.endTime = source["endTime"];
	        this.duration = source["duration"];
	        this.completedCycles = source["completedCycles"];
	        this.isCompleted = source["isCompleted"];
	    }
	}

}

export namespace time {
	
	export class Time {
	
	
	    static createFrom(source: any = {}) {
	        return new Time(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}

