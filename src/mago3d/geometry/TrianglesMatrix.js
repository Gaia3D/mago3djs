'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class TrianglesMatrix
 */
var TrianglesMatrix= function() 
{
	if (!(this instanceof TrianglesMatrix)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.trianglesListsArray;
};