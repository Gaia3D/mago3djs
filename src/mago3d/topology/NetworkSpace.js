'use strict';

/**
 * NetworkSpace.***
 * 
 * @alias NetworkSpace
 * @class NetworkSpace
 */
var NetworkSpace = function(owner) 
{
	if (!(this instanceof NetworkSpace)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.networkOwner = owner;
	this.id;
	this.mesh;
	this.attributes;
	
};