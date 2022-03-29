'use strict';

var GeographicCoord_ = function(lon, lat, alt) 
{
	this.longitude;
	this.latitude;
	this.altitude;
	
	if (lon !== undefined) 
	{ 
		this.longitude = lon; 
	}
	
	if (lat !== undefined) 
	{ 
		this.latitude = lat; 
	}
	
	if (alt !== undefined) 
	{ 
		this.altitude = alt; 
	}
};

GeographicCoord_.prototype.setLonLatAlt = function(longitude, latitude, altitude) 
{
	if (longitude !== undefined) 
	{ 
		this.longitude = longitude; 
	}

	if (latitude !== undefined) 
	{ 
		this.latitude = latitude; 
	}

	if (altitude !== undefined) 
	{ 
		this.altitude = altitude; 
	}
};

/**
 * Returns if the geographicCoord is coincident to this.
 * @param {GeographicCoord} geographicCoord
 * @param {Number} error
 * @returns {Boolean}
 */
 GeographicCoord_.prototype.isCoincidentToGeoCoord = function(geographicCoord, error, errorForAltitude) 
 {
	 if (!error)
	 { error = 1E-8; }
 
	 if (!errorForAltitude)
	 { errorForAltitude = 1E-6; }
 
	 if (Math.abs(this.longitude - geographicCoord.longitude) > error)
	 { return false; }
 
	 if (Math.abs(this.latitude - geographicCoord.latitude) > error)
	 { return false; }
 
	 if (this.altitude && geographicCoord.altitude)
	 {
		 if (Math.abs(this.altitude - geographicCoord.altitude) > errorForAltitude)
		 { return false; }
	 }
 
	 return true;
 };
 