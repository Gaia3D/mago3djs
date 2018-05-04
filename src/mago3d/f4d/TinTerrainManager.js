'use strict';

/**
 * @class TinTerrainManager
 */
var TinTerrainManager = function() 
{
	if (!(this instanceof TinTerrainManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.maxDepth = 14;
	this.currentVisiblesMap = {};
	
};