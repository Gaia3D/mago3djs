'use strict';


/**
 * @class DustLayer
 */
var DustLayer = function(options) 
{
	if (!(this instanceof DustLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.weatherStation;
	this.gl;
	
	
};