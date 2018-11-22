'use strict';

/**
 * NetworkSpace.***
 * 
 * @alias NetworkSpace
 * @class NetworkSpace
 */
var NetworkSpace = function() 
{
	if (!(this instanceof NetworkSpace)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.id;
	this.mesh;
	this.attributes;
	
};