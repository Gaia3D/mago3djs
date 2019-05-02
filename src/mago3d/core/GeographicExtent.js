'use strict';

/**
 * GeographicExtent
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
 * 어떤 일을 하고 있습니까?
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
 * 어떤 일을 하고 있습니까?
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
 * 어떤 일을 하고 있습니까?
 */
GeographicExtent.prototype.getMidPoint = function(resultGeographicCoord) 
{
	return GeographicCoord.getMidPoint(this.minGeographicCoord, this.maxGeographicCoord, resultGeographicCoord);
};

















































