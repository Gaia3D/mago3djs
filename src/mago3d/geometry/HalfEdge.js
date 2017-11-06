
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class HalfEdge
 */
var HalfEdge = function() 
{
	if (!(this instanceof HalfEdge)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.origenVertex;
	this.nextEdge;
	this.twinEdge;
	this.face;
};