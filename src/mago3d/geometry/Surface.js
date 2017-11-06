'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Surface
 */
var Surface = function() 
{
	if (!(this instanceof Surface)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.facesArray;
};