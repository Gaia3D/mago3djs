'use strict';

/**
 * NetworkNode.
 * 
 * @alias NetworkNode
 * @class NetworkNode
 */
var NetworkNode = function(owner) 
{
	if (!(this instanceof NetworkNode)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.networkOwner = owner;
	this.id;
	this.edgesArray;
	this.attributes;
	this.box;
	//this.mesh; // if display as a box, cilinder, etc.
};