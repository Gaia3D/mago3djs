'use strict';

/**
 * SpotLight.
 * 
 * @class SpotLight
 * @constructor 
 */
var SpotLight = function(options) 
{
	if (!(this instanceof SpotLight)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.geoLocDataManager = new GeoLocationDataManager();
	this.directionWC;
	
	// create the initial position of the sun.
	var geoLocData = this.geoLocDataManager.newGeoLocationData("lightPosition");
	var lon = 115.31586919332165;
	var lat = 10.0;
	var alt = 0.0;
	geoLocData = ManagerUtils.calculateGeoLocationData(lon, lat, alt, undefined, undefined, undefined, geoLocData);
	
	var lightRotMat = geoLocData.rotMatrix;
	this.directionWC = new Float32Array([-lightRotMat._floatArrays[8], -lightRotMat._floatArrays[9], -lightRotMat._floatArrays[10]]);
	//this.init();
};