'use strict';

/**
 * Bouonding box which has vertexs represented as lon,lat,alt.
 * @class GeographicExtent
 */
var GeographicExtent = function(minLon, minLat, minAlt, maxLon, maxLat, maxAlt) 
{
	if (!(this instanceof GeographicExtent)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.minGeographicCoord;
	this.maxGeographicCoord;
	
	if (minLon !== undefined && minLat !== undefined && minAlt !== undefined)
	{
		if (this.minGeographicCoord === undefined)
		{ this.minGeographicCoord = new GeographicCoord(); }
		
		this.minGeographicCoord.setLonLatAlt(minLon, minLat, minAlt);
	}
	
	if (maxLon !== undefined && maxLat !== undefined && maxAlt !== undefined)
	{
		if (this.maxGeographicCoord === undefined)
		{ this.maxGeographicCoord = new GeographicCoord(); }
		
		this.maxGeographicCoord.setLonLatAlt(maxLon, maxLat, maxAlt);
	}
};

/**
 * Clear the value of this instance
 */
GeographicExtent.prototype.deleteObjects = function() 
{
	if (this.minGeographicCoord !== undefined)
	{
		this.minGeographicCoord.deleteObjects();
		this.minGeographicCoord = undefined;
	}
	
	if (this.maxGeographicCoord !== undefined)
	{
		this.maxGeographicCoord.deleteObjects();
		this.maxGeographicCoord = undefined;
	}
};

/**
 * set the value of this instance
 * @param minLon the value of lon of the lower bound
 * @param minLat the value of lat of the lower bound
 * @param minAlt the value of alt of the lower bound
 * @param maxLon the value of lon of the lower bound
 * @param maxLat the value of lat of the lower bound
 * @param maxAlt the value of alt of the lower bound
 */
GeographicExtent.prototype.setExtent = function(minLon, minLat, minAlt, maxLon, maxLat, maxAlt) 
{
	if (this.minGeographicCoord === undefined)
	{ this.minGeographicCoord = new GeographicCoord(); }
	
	this.minGeographicCoord.setLonLatAlt(minLon, minLat, minAlt);
	
	if (this.maxGeographicCoord === undefined)
	{ this.maxGeographicCoord = new GeographicCoord(); }
	
	this.maxGeographicCoord.setLonLatAlt(maxLon, maxLat, maxAlt);
};

/**
 * set the value of this instance
 * @param lon
 * @param lat
 * @param alt
 */
GeographicExtent.prototype.setInitExtent = function(lon, lat, alt) 
{
	this.setExtent(lon, lat, alt, lon, lat, alt);
};

/**
 * set the value of this instance
 * @param lon
 * @param lat
 * @param alt
 */
GeographicExtent.prototype.addGeographicCoord = function(geoCoord) 
{
	var lon = geoCoord.longitude;
	var lat = geoCoord.latitude;
	var alt = geoCoord.altitude;
	
	if (this.minGeographicCoord === undefined)
	{ 
		this.minGeographicCoord = new GeographicCoord(); 
		this.minGeographicCoord.setLonLatAlt(lon, lat, alt);
	}
	else 
	{
		if (lon < this.minGeographicCoord.longitude)
		{ this.minGeographicCoord.setLongitude(lon); }
		
		if (lat < this.minGeographicCoord.latitude)
		{ this.minGeographicCoord.setLatitude(lat); }
		
		if (alt < this.minGeographicCoord.altitude)
		{ this.minGeographicCoord.setAltitude(alt); }
	}
	
	if (this.maxGeographicCoord === undefined)
	{ 
		this.maxGeographicCoord = new GeographicCoord(); 
		this.maxGeographicCoord.setLonLatAlt(lon, lat, alt);
	}
	else 
	{
		if (lon > this.maxGeographicCoord.longitude)
		{ this.maxGeographicCoord.setLongitude(lon); }
		
		if (lat > this.maxGeographicCoord.latitude)
		{ this.maxGeographicCoord.setLatitude(lat); }
		
		if (alt > this.maxGeographicCoord.altitude)
		{ this.maxGeographicCoord.setAltitude(alt); }
	}
};

GeographicExtent.prototype.getCenterLongitude = function() 
{
	var minLon = this.minGeographicCoord.longitude;
	var maxLon = this.maxGeographicCoord.longitude;
	return (maxLon+minLon)/2;
};

GeographicExtent.prototype.getCenterLatitude = function() 
{
	var minLat = this.minGeographicCoord.latitude;
	var maxLat = this.maxGeographicCoord.latitude;
	return (maxLat+minLat)/2;
};

GeographicExtent.prototype.getCenterAltitude = function() 
{
	var minAlt = this.minGeographicCoord.altitude;
	var maxAlt = this.maxGeographicCoord.altitude;
	return (maxAlt+minAlt)/2;
};

/**
 * Returns the middle point of the lower bound point and uppper bound point
 * @param resultGeographicCoord the point which will save the result
 * @returns {GeographicCoord}
 */
GeographicExtent.prototype.getMidPoint = function(resultGeographicCoord) 
{
	return GeographicCoord.getMidPoint(this.minGeographicCoord, this.maxGeographicCoord, resultGeographicCoord);
};

/**
 * Returns the minimum latitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMinLatitudeRad = function() 
{
	if (this.minGeographicCoord === undefined)
	{ return; }
	
	return this.minGeographicCoord.getLatitudeRad();
};

/**
 * Returns the minimum latitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMinAltitude = function() 
{
	if (this.minGeographicCoord === undefined)
	{ return; }
	
	return this.minGeographicCoord.altitude;
};

/**
 * Returns the minimum latitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMaxAltitude = function() 
{
	if (this.maxGeographicCoord === undefined)
	{ return; }
	
	return this.maxGeographicCoord.altitude;
};

/**
 * Returns the minimum longitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMinLongitudeRad = function() 
{
	if (this.minGeographicCoord === undefined)
	{ return; }
	
	return this.minGeographicCoord.getLongitudeRad();
};

/**
 * Returns the maximum latitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMaxLatitudeRad = function() 
{
	if (this.maxGeographicCoord === undefined)
	{ return; }
	
	return this.maxGeographicCoord.getLatitudeRad();
};

/**
 * Returns the maximum longitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMaxLongitudeRad = function() 
{
	if (this.maxGeographicCoord === undefined)
	{ return; }
	
	return this.maxGeographicCoord.getLongitudeRad();
};

















































