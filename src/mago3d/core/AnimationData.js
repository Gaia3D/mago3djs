'use strict';

/**
 * save the data related with making feature move
 * @class AnimationData
 */
var AnimationData = function() 
{
	if (!(this instanceof AnimationData)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.birthTime; //the first update time
	this.lastTime; // the last update time.
	this.durationInSeconds;
	
	// start location.
	this.startLongitude;
	this.startLatitude;
	this.startAltitude;
	
	// target location.
	this.targetLongitude;
	this.targetLatitude;
	this.targetAltitude;
	
	// target rotation.
	this.targetHeading;
	this.targetPitch;
	this.targetRoll;
	
	// linear velocity in m/s.
	this.linearVelocityInMetersSecond;
	
	// angular velocity deg/s.
	this.headingAngDegSecondVelocity;
	this.pitchAngDegSecondVelocity;
	this.rollAngDegSecondVelocity;
};
