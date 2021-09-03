'use strict';

/**
 * @class MgSetCollection
 * @constructor 
 */
var MgSetCollection = function () 
{
	if (!(this instanceof MgSetCollection)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.mgSetsArray = [];
};