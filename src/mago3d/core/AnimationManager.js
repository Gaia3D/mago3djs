'use strict';

/**
 * AnimationData
 * @class AnimationData
 */
var AnimationData = function() 
{
	if (!(this instanceof AnimationData)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.birthTime;
	this.lastTime; // the last update time.***
	this.durationInSeconds;
	
	// target location.***
	this.targetLongitude;
	this.targetLatitude;
	this.targetAltitude;
	
	// target rotation.***
	this.targetHeading;
	this.targetPitch;
	this.targetRoll;
	
	// linear velocity in m/s.***
	this.linearVelocityInMetersSecond;
	
	// angular velocity deg/s.***
	this.headingAngDegSecondVelocity;
	this.pitchAngDegSecondVelocity;
	this.rollAngDegSecondVelocity;
	
};

/**
 * AnimationManager
 * @class AnimationManager
 */
var AnimationManager = function() 
{
	if (!(this instanceof AnimationManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	
	
};