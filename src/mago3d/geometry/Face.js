'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Face
 */
var Face = function() 
{
	if (!(this instanceof Face)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.halfEdge;
};