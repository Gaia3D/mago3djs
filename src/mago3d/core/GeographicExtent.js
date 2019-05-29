'use strict';

/**
 * Bouonding box which has vertexs represented as lon,lat,alt.
 * @class GeographicExtent
 */
var GeographicExtent = function() 
{
	if (!(this instanceof GeographicExtent)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.minGeographicCoord;
	this.maxGeographicCoord;
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
 * Get the middle point of the lower bound point and uppper bound point
 * @param resultGeographicCoord the point which will save the result
 * @return {GeographicCoord}
 */
GeographicExtent.prototype.getMidPoint = function(resultGeographicCoord) 
{
	return GeographicCoord.getMidPoint(this.minGeographicCoord, this.maxGeographicCoord, resultGeographicCoord);
};

















































