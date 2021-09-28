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