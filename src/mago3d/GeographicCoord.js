'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class GeographicCoord
 */
var GeographicCoord = function() {
	if(!(this instanceof GeographicCoord)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.longitude;
	this.latitude;
	this.altitude;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param longitude 경도
 * @param latitude 위도
 * @param altitude 고도
 */
GeographicCoord.prototype.setLonLatAlt = function(longitude, latitude, altitude) {
	this.longitude = longitude;
	this.latitude = latitude;
	this.altitude = altitude;
};