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
	if(this.minGeographicCoord !== undefined)
	{
		this.minGeographicCoord.deleteObjects();
		this.minGeographicCoord = undefined;
	}
	
	if(this.maxGeographicCoord !== undefined)
	{
		this.maxGeographicCoord.deleteObjects();
		this.maxGeographicCoord = undefined;
	}
}
