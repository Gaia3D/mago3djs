'use strict';

/**
 * 
 * @class ProcessCounterManager
 */
var ProcessCounterManager = function() 
{
	if (!(this instanceof ProcessCounterManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.shadowMeshesMadeCount = 0;
};

/**
 * 
 */
ProcessCounterManager.prototype.reset = function()
{
	this.shadowMeshesMadeCount = 0;
};