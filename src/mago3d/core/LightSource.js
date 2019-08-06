'use strict';

/**
 * LightSource.
 * 
 * @class LightSource
 * @constructor 
 * @param {string} geoLocationDataName The name of the LightSource.
 */
var LightSource = function(lightType) 
{
	if (!(this instanceof LightSource)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	/**
	 * The name of this LightSource.
	 * @type {String}
	 * @default "noName"
	 */
	this.name;
	
	this.lightType = lightType; // omni = 0, spot = 1, directional = 2, area = 3, volume = 4.
	
	this.position;
	this.positionHIGH;
	this.positionLOW;
	this.tMatrix;
	
};