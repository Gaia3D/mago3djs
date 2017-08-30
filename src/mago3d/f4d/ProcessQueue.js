'use strict';

/**
 * ProcessQueue
 * 
 * @alias ProcessQueue
 * @class ProcessQueue
 */
var ProcessQueue = function() 
{
	if (!(this instanceof ProcessQueue)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.buildingsToDelete = [];
};