'use strict';

/**
 * NetworkEdge.***
 * 
 * @alias NetworkEdge
 * @class NetworkEdge
 */
var NetworkEdge = function() 
{
	if (!(this instanceof NetworkEdge)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.id;
	this.strNode;
	this.endNode;
	this.sense;
	this.attributes;
	
	// provisionally:
	this.strNodeId;
	this.endNodeId;
};