'use strict';

/**
 * This class is used to control the movement of objects.
 * @class CameraController
 */
var CameraController = function() 
{
	if (!(this instanceof CameraController)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.startGeoCoord;
	this.targetGeoCoord;
	this.travelDurationInSeconds;
	
	this.acceleration; // m/s2.***
	this.velocity; // m/s.***
	
	
};