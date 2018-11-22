'use strict';

/**
 * NetworkNode.***
 * 
 * @alias NetworkNode
 * @class NetworkNode
 */
var NetworkNode = function() 
{
	if (!(this instanceof NetworkNode)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.id;
	this.edgesArray;
	this.attributes;
	this.box;
	//this.mesh; // if display as a box, cilinder, etc.***
};