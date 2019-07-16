'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class PipeKnot
 */
var PipeKnot = function() 
{
	if (!(this instanceof PipeKnot)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// Position & curvatureRadius.***
	this.position;
	this.radius;
	
};