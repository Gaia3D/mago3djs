'use strict';

/**
 * NetworkEdge.***
 * 
 * @alias NetworkEdge
 * @class NetworkEdge
 */
var NetworkEdge = function(owner) 
{
	if (!(this instanceof NetworkEdge)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.networkOwner = owner;
	this.id;
	this.strNode;
	this.endNode;
	this.sense;
	this.attributes;
	
	// provisionally:
	this.strNodeId;
	this.endNodeId;
};