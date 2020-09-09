'use strict';

/**
 * @class WeatherVolume
 */
var WeatherVolume = function(options) 
{
	if (!(this instanceof WeatherVolume)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	//this.windLayersArray;
	this.weatherStation;
	this.extrusionHeight;
	
	// Box & plane.
	this.displayBox;
	this.displayPlane;
	this.displayPlanesArray = [];
};