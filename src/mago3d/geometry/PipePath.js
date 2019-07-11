'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class PipePath
 */
var PipePath = function(points3dArray) 
{
	if (!(this instanceof PipePath)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	

	this.dirty = true;
	
};