'use strict';

/**
 * This is a group of skin-type buildings.
 * @class MultiBuildings
 */
var MultiBuildings = function() 
{
	if (!(this instanceof MultiBuildings)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// The multiBuildings shares vboBuffers.
	this.skinBuildingsArray;
	
};