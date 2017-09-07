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