'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class PolyLine
 */
var PolyLine = function() 
{
	if (!(this instanceof PolyLine)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.point3dArray;
};